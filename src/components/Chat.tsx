import BouncingDotsLoader from "@/components/BouncingDotsLoader";
import FeatureCard from "@/components/FeatureCard";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useChat } from "ai/react";
import { BanIcon, Send } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";

export default function Chat({ isVectorised }: { isVectorised: boolean }) {
  const { query } = useRouter();

  const docId = query?.docId;

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
  } = useChat({
    body: {
      docId: docId as string,
    },

    onError: (err: any) => {
      toast({
        title: "Error",
        description: error?.message ?? "Something went wrong",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  //implement autoscrolling, and infinite loading => also fetch the messages from prev session and display
  const { data: prevChatMessages } = api.message.getAllByDocId.useQuery(
    {
      docId: docId as string,
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  const messageWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageWindowRef.current?.scrollTo(
      0,
      messageWindowRef.current.scrollHeight,
    );
  }, [messages, prevChatMessages]);

  const { mutate: vectoriseDocMutation, isLoading: isVectorising } =
    api.document.vectorise.useMutation({
      onSuccess: () => {
        utils.document.getDocData.setData(
          { docId: docId as string },
          (prev) => {
            if (!prev) return undefined;
            return {
              ...prev,
              isVectorised: true,
            };
          },
        );
      },
    });

  const utils = api.useContext();

  if (!isVectorised) {
    return (
      <FeatureCard
        isLoading={isVectorising}
        bulletPoints={[
          "🔍 Search and ask questions about any part of your PDF.",
          "📝 Summarize content with ease.",
          "📊 Analyze and extract data effortlessly.",
        ]}
        onClick={() => {
          vectoriseDocMutation(
            { documentId: docId as string },
            {
              onError: (err: any) => {
                toast({
                  title: "Uh-oh",
                  description: err?.message ?? "Something went wrong",
                  variant: "destructive",
                  duration: 3000,
                });
              },
            },
          );
        }}
        buttonText="Turn PDF Interactive"
        subtext="Easily extract key information and ask questions on the fly:"
        title="Unleash the power of your PDF documents through interactive chat!"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden">
      <div
        className="hideScrollbar flex flex-1 flex-col gap-2 overflow-auto"
        ref={messageWindowRef}
      >
        {[
          {
            id: "id",
            content:
              "Welcome to **Uxie**! I'm here to assist you. Feel free to ask questions or discuss topics based on the data provided. Whether it's clarifying information, diving deeper into a subject, or exploring related topics, I'm ready to help. Let's make the most out of your learning!",

            role: "assistant",
          },
          ...(prevChatMessages ?? []),

          ...messages,
        ].map((m) => (
          <div
            key={m.id}
            className={cn(
              m.role === "user" && "ml-auto",
              m.role === "assistant" && "mr-auto",
              "max-w-[80%] text-left ",
            )}
          >
            <ReactMarkdown
              className={cn(
                m.role === "user" &&
                  "prose-invert bg-blue-500 text-gray-50 prose-code:text-gray-100",
                m.role === "assistant" && "bg-gray-100 ",
                "prose rounded-xl px-3 py-1",
              )}
            >
              {m.content}
            </ReactMarkdown>
          </div>
        ))}

        {isLoading && messages.at(-1)?.role === "user" && (
          <div
            className={cn(
              "mr-auto bg-gray-100 text-black",
              "max-w-[80%] rounded-xl px-3 py-2 text-left ",
            )}
          >
            <BouncingDotsLoader />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex w-full rounded-md border shadow-xl">
          <TextareaAutosize
            placeholder="Ask any question..."
            className="flex-1 resize-none rounded border-0 border-gray-300 p-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                e.preventDefault();
                // @ts-ignore
                handleSubmit(e);
              } else if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            value={input}
            onChange={handleInputChange}
            autoFocus
            maxRows={4}
          />
          {isLoading ? (
            <button className="w-fit bg-gray-50 px-2">
              <BanIcon size={24} className="text-gray-500" onClick={stop} />
            </button>
          ) : (
            <button
              className="group w-fit rounded-ee-md rounded-se-md bg-blue-500 px-2"
              type="submit"
            >
              <Send
                size={24}
                className="text-gray-100 group-hover:text-gray-200"
              />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
