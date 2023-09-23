import { useEffect } from "react";
import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  Popup,
  AreaHighlight,
} from "react-pdf-highlighter";
import testHighlights from "@/lib/test-highlights.json";
import { Spinner } from "@/components/Spinner";
import {
  ChevronLeft,
  ClipboardCopy,
  Highlighter,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRouter } from "next/router";
// import InviteCollab from "@/components/InviteCollab";

const highlights = testHighlights;

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021.pdf";

const DocViewer = () => {
  const { query, isReady } = useRouter();

  const docId = query?.docId;

  const {
    data: doc,
    isLoading,
    isError,
  } = api.document.getDocData.useQuery(
    {
      docId: docId as string,
    },
    {
      enabled: !!docId,
    },
  );

  let scrollViewerTo = (highlight: any) => {};

  const scrollToHighlightFromHash = () => {
    const highlight = getHighlightById(parseIdFromHash());

    if (highlight) {
      scrollViewerTo(highlight);
    }
  };

  useEffect(() => {
    const scrollToHighlightFromHash = () => {};

    window.addEventListener("hashchange", scrollToHighlightFromHash, false);

    return () => {
      window.removeEventListener("hashchange", scrollToHighlightFromHash);
    };
  }, []);

  function getHighlightById(id: string) {
    // return doc?.highlights?.find((highlight) => highlight.id === id);
    return highlights?.find((highlight) => highlight.id === id);
  }

  async function addHighlight({
    content,
    position,
  }: {
    content: {
      text?: string;
      image?: string;
    };
    position: any;
  }) {
    console.log("adding highlight");

    // mutateHighlights();
  }

  const deleteHighlight = (id: string) => {
    console.log("deleting highlight", id);

    // mutateHighlights();
  };

  // if (isError) {
  //   return <>error</>;
  // }

  // if (!doc || !doc.highlights || !doc.url || !isReady) {
  //   return;
  // }

  return (
    <div className="flex h-screen flex-col">
      <div className=" flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/f" className="rounded-md p-2 hover:bg-gray-200">
            <ChevronLeft size={16} />
          </Link>
          <p className="font-semibold dark:text-gray-200">
            {doc?.title ?? docId}
            {/* Docnameee */}
          </p>
        </div>
        <div className="h-12 rounded-es-md rounded-ss-md bg-blue-200 px-2 py-4">
          {/* <InviteCollab docId={docId} /> */}
        </div>
      </div>
      <div className="relative h-screen w-full ">
        <PdfLoader url={doc?.url ?? PRIMARY_PDF_URL} beforeLoad={<Spinner />}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={resetHash}
              // pdfScaleValue="page-width"
              scrollRef={(scrollTo) => {
                scrollViewerTo = scrollTo;
                scrollToHighlightFromHash();
              }}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection,
              ) => (
                <TextSelectionPopover
                  content={content}
                  hideTipAndSelection={hideTipAndSelection}
                  position={position}
                  addHighlight={() => addHighlight({ content, position })}
                />
              )}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo,
              ) => {
                const isTextHighlight = !Boolean(
                  highlight.content && highlight.content.image,
                );

                const component = isTextHighlight ? (
                  <Highlight
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={{
                      emoji: "",
                      text: "",
                    }}
                  />
                ) : (
                  <AreaHighlight
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                    onChange={() => {}}

                    // onChange={(boundingRect) => {
                    //   updateHighlight(
                    //     highlight.id,
                    //     { boundingRect: viewportToScaled(boundingRect) },
                    //     { image: screenshot(boundingRect) },
                    //   );
                    // }}
                  />
                );

                return (
                  <Popup
                    popupContent={
                      <HighlightedTextPopup
                        id={highlight.id}
                        deleteHighlight={deleteHighlight}
                      />
                    }
                    onMouseOver={(popupContent) =>
                      setTip(highlight, (highlight) => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                  >
                    {component}
                  </Popup>
                );
              }}
              highlights={highlights}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
};

export default DocViewer;

const TextSelectionPopover = ({
  content,
  hideTipAndSelection,
  position,
  addHighlight,
}: {
  position: any;
  addHighlight: () => void;
  content: {
    text?: string | undefined;
    image?: string | undefined;
  };
  hideTipAndSelection: () => void;
}) => {
  const copyTextToClipboard = () => {
    // check how to copy image to clipboard
    if (content.text) {
      navigator.clipboard.writeText(content.text);
    }
    hideTipAndSelection();
  };

  return (
    <div className="flex gap-2 rounded-md bg-black p-2 ">
      <Highlighter
        size={18}
        className="rounded-full text-gray-200 hover:cursor-pointer"
        onClick={() => {
          addHighlight();
          hideTipAndSelection();
        }}
      />
      <ClipboardCopy
        size={18}
        className="rounded-full text-gray-200 hover:cursor-pointer"
        onClick={copyTextToClipboard}
      />
    </div>
  );
};

const HighlightedTextPopup = ({
  id,
  deleteHighlight,
}: {
  id: string;
  deleteHighlight: any;
}) => {
  return (
    <div className="rounded-full bg-gray-200  text-black">
      <TrashIcon
        size={24}
        className="hover:cursor-pointer"
        onClick={() => {
          deleteHighlight(id);
        }}
      />
    </div>
  );
};