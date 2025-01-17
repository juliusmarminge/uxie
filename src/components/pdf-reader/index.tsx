import PdfReader from "@/components/pdf-reader/reader";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useBlocknoteEditorStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AppRouter } from "@/server/api/root";
import { BlockNoteEditorType } from "@/types/editor";
import { HighlightContentType, HighlightPositionType } from "@/types/highlight";
import { insertOrUpdateBlock } from "@blocknote/core";
import { createId } from "@paralleldrive/cuid2";
import { HighlightTypeEnum } from "@prisma/client";
import { inferRouterOutputs } from "@trpc/server";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { toast } from "sonner";

interface AddHighlightType {
  content: {
    text?: string;
    image?: string;
  };
  position: HighlightPositionType;
}

const addHighlightToNotes = (
  content: string,
  highlightId: string,
  type: HighlightContentType,
  editor: BlockNoteEditorType | null,
  canEdit: boolean,
) => {
  if (!editor) {
    toast.error("Something went wrong.", {
      duration: 3000,
    });
    return;
  }

  if (!canEdit) {
    toast.error(
      "User doesn't have the required permission to edit the document",
      {
        duration: 3000,
      },
    );
    return;
  }

  if (type === HighlightContentType.TEXT) {
    if (!content || !highlightId) return;

    insertOrUpdateBlock(editor, {
      content,
      props: {
        highlightId,
      },
      type: "highlight",
    });
  } else {
    if (!content || !highlightId) return;

    try {
      insertOrUpdateBlock(editor, {
        props: {
          url: content,
        },
        type: "image",
      });
    } catch (err: any) {
      console.log(err.message, "errnes");
    }
  }
};

export const getHighlightById = (
  id: string,
  doc: inferRouterOutputs<AppRouter>["document"]["getDocData"],
) => {
  return doc?.highlights?.find((highlight) => highlight.id === id);
};

const DocViewer = ({
  canEdit,
  doc,
}: {
  canEdit: boolean;
  doc: inferRouterOutputs<AppRouter>["document"]["getDocData"];
}) => {
  const { query, isReady } = useRouter();

  const docId = query?.docId as string;

  const { mutate: addHighlightMutation } = api.highlight.add.useMutation({
    async onMutate(newHighlight) {
      await utils.document.getDocData.cancel();
      const prevData = utils.document.getDocData.getData();

      // @ts-ignore
      utils.document.getDocData.setData({ docId: docId }, (old) => {
        if (!old) return null;

        return {
          ...old,
          highlights: [
            ...old.highlights,
            {
              position: {
                boundingRect: newHighlight.boundingRect,
                rects: newHighlight.rects,
                pageNumber: newHighlight.pageNumber,
              },
            },
          ],
        };
      });

      return { prevData };
    },
    onError(err, newPost, ctx) {
      toast.error("Something went wrong", {
        duration: 3000,
      });

      utils.document.getDocData.setData({ docId: docId }, ctx?.prevData);
    },
    onSettled() {
      // Sync with server once mutation has settled
      utils.document.getDocData.invalidate();
    },
  });
  const { mutate: deleteHighlightMutation } = api.highlight.delete.useMutation({
    async onMutate(oldHighlight) {
      await utils.document.getDocData.cancel();
      const prevData = utils.document.getDocData.getData();

      utils.document.getDocData.setData({ docId: docId }, (old) => {
        if (!old) return undefined;
        return {
          ...old,
          highlights: [
            ...old.highlights.filter(
              (highlight) => highlight.id !== oldHighlight.highlightId,
            ),
          ],
        };
      });

      return { prevData };
    },
    onError(err, newPost, ctx) {
      toast.error("Something went wrong", {
        duration: 3000,
      });
      utils.document.getDocData.setData({ docId: docId }, ctx?.prevData);
    },
    onSettled() {
      utils.document.getDocData.invalidate();
    },
  });

  const { editor } = useBlocknoteEditorStore();

  const utils = api.useContext();

  useEffect(() => {
    const scrollToHighlightFromHash = () => {};

    window.addEventListener("hashchange", scrollToHighlightFromHash, false);

    return () => {
      window.removeEventListener("hashchange", scrollToHighlightFromHash);
    };
  }, []);

  async function addHighlight({ content, position }: AddHighlightType) {
    const highlightId = createId();

    if (!content.text && !content.image) return;
    const isTextHighlight = !content.image;

    // todo check if user has edit/admin access => also dont render the highlight popover for them.

    addHighlightMutation({
      id: highlightId,
      boundingRect: position.boundingRect,
      type: isTextHighlight ? HighlightTypeEnum.TEXT : HighlightTypeEnum.IMAGE,
      documentId: docId,
      pageNumber: position.pageNumber,
      rects: position.rects,
    });

    if (isTextHighlight) {
      if (!content.text) return;

      // todo why is id being passed here?
      addHighlightToNotes(
        content.text,
        highlightId,
        HighlightContentType.TEXT,
        editor,
        canEdit,
      );
    } else {
      if (!content.image) return;

      addHighlightToNotes(
        content.image,
        highlightId,
        HighlightContentType.IMAGE,
        editor,
        canEdit,
      );
    }
  }

  const deleteHighlight = (id: string) => {
    // todo check if user has edit/admin access
    deleteHighlightMutation({
      documentId: docId,
      highlightId: id,
    });
  };

  if (!doc || !doc.highlights || !isReady) {
    return;
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center">
        <Link
          href="/f"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit justify-start",
          )}
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4" />
        </Link>

        <p className="line-clamp-1 font-semibold">{doc?.title ?? docId}</p>
      </div>
      <div className="relative h-full w-full">
        <PdfReader
          deleteHighlight={deleteHighlight}
          doc={doc}
          addHighlight={addHighlight}
        />
      </div>
    </div>
  );
};

export default DocViewer;
