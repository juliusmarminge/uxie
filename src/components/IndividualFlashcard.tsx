import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { RequestOptions } from "ai";
import { useCompletion } from "ai/react";
import {
  BugIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

interface FlashcardAttemptType {
  userResponse: string;
  correctResponse: string | null;
  incorrectResponse: string | null;
  moreInfo: string | null;
}

const IndividualFlashcard = ({
  question,
  answer,
  total,
  current,
  setCurrent,
  id,
  attempts,
}: {
  question: string;
  answer: string;
  total: number;
  current: number;
  setCurrent: React.Dispatch<React.SetStateAction<number>>;
  id: string;
  attempts: FlashcardAttemptType[];
}) => {
  const [hasAttempted, setHasAttempted] = useState(false);

  const { query } = useRouter();
  const documentId = query?.docId as string;

  const { complete, completion, isLoading, stop, setCompletion } =
    useCompletion({
      body: {
        flashcardId: id,
        docId: documentId,
      },

      onFinish: (_prompt, completion) => {},
      onError: (err: any) => {
        console.log(err.message);
        toast({
          title: "Error",
          description: "Something went wrong with text generation",
          variant: "destructive",
          duration: 3000,
        });
      },
      api: "/api/evaluate",
    });

  console.log(completion, "completion");

  const toggleAttempt = () => {
    setHasAttempted((prev) => !prev);
  };

  const [userResponse, setUserResponse] = useState("");

  return (
    <div className="flex h-full flex-col justify-between overflow-scroll ">
      {hasAttempted ? (
        <IndividualFlashcardReport
          question={question}
          answer={answer}
          total={total}
          current={current}
          //   think whether or not to show previous attempts in the current report. also think whether to add along w. the question screen
          completion={completion}
          isLoading={isLoading}
          toggleAttempt={toggleAttempt}
          userResponse={userResponse}
          setUserResponse={setUserResponse}
        />
      ) : (
        <IndividualFlashcardQuestion
          attempts={attempts}
          setCompletion={setCompletion}
          complete={complete}
          question={question}
          answer={answer}
          toggleAttempt={toggleAttempt}
          userResponse={userResponse}
          setUserResponse={setUserResponse}
        />
      )}

      <div className="flex items-center justify-between">
        <Button
          className="flex items-center"
          variant="ghost"
          disabled={current === 1}
          onClick={() => {
            if (hasAttempted) {
              toggleAttempt();
            }
            setUserResponse("");
            setCompletion("");
            setCurrent((prev) => prev - 1);
          }}
        >
          <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
          <span className="ml-2">Back</span>
        </Button>

        <span className="text-gray-600">
          {current} of {total}
        </span>

        <Button
          className="flex items-center"
          variant="ghost"
          disabled={current === total}
          onClick={() => {
            if (hasAttempted) {
              toggleAttempt();
            }
            setUserResponse("");
            setCompletion("");
            setCurrent((prev) => prev + 1);
          }}
        >
          <span className="mr-2">Skip</span>
          <ChevronRightIcon className="h-6 w-6 text-gray-600" />
        </Button>
      </div>
    </div>
  );
};
export default IndividualFlashcard;

const IndividualFlashcardQuestion = ({
  question,
  answer,
  complete,
  toggleAttempt,
  userResponse,
  setUserResponse,
  setCompletion,
  attempts,
}: {
  question: string;
  answer: string;
  complete: (
    prompt: string,
    options?: RequestOptions | undefined,
  ) => Promise<string | null | undefined>;
  toggleAttempt: () => void;
  userResponse: string;
  setUserResponse: React.Dispatch<React.SetStateAction<string>>;
  setCompletion: (completion: string) => void;
  attempts: FlashcardAttemptType[];
}) => {
  return (
    <>
      <div>
        <div className="mb-6">
          <div className="rounded-t-lg bg-[#DFFFD6] p-4">
            <h1 className="text-lg font-semibold">{question}</h1>
          </div>
          <div className="rounded-b-lg border border-t-0 p-4">
            <Textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              className="h-24 w-full p-2"
              placeholder="Enter your answer..."
            />
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <Button
            disabled={!userResponse}
            onClick={() => {
              toggleAttempt();
              complete(userResponse);
            }}
            className="bg-[#34D399] text-white hover:bg-[#2E8B57]"
          >
            Answer
          </Button>
          <Button
            onClick={() => {
              toggleAttempt();
              setCompletion("");
            }}
            variant="ghost"
          >
            Don&apos;t know
          </Button>
        </div>
        {/* <div className="flex items-center justify-between border-t pt-4"> */}
      </div>

      <div>
        {attempts.length > 0 && (
          <>
            <h2 className="mb-2 font-semibold text-gray-600">
              Previous attempts
            </h2>

            <Accordion type="single" collapsible>
              {attempts.map((attempt, index) => (
                <AccordionItem value={index.toString()} key={index}>
                  <AccordionTrigger className="px-2 font-semibold">
                    Attempt {index + 1}
                  </AccordionTrigger>
                  <AccordionContent className="rounded-md bg-gray-50 p-4">
                    <Feedback
                      correctResponse={attempt.correctResponse}
                      wrongResponse={attempt.incorrectResponse}
                      moreInfo={attempt.moreInfo}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        )}
      </div>
    </>
  );
};

const IndividualFlashcardReport = ({
  question,
  answer,
  total,
  current,
  toggleAttempt,
  completion,
  isLoading,
  userResponse,
  setUserResponse,
}: {
  question: string;
  answer: string;
  total: number;
  current: number;
  toggleAttempt: () => void;
  completion: string;
  isLoading: boolean;
  userResponse: string;
  setUserResponse: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const splitResponse = completion.split("||");
  return (
    <>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{question}</h3>
          <Button
            variant="ghost"
            onClick={() => {
              toggleAttempt();
              setUserResponse("");
            }}
          >
            <RefreshCwIcon className="h-6 w-6" />
          </Button>
        </div>
        {/* <p className="mb-4 text-sm text-gray-500">From page 7</p> */}
        <div className="mb-6 rounded-md bg-[#f7fafc] p-4">
          <p className="mb-2 font-semibold">Your answer</p>
          <p className="text-sm">{userResponse}</p>
        </div>

        {(isLoading || completion) && (
          <>
            <h2 className="mb-2 px-2 font-semibold text-gray-600">Feedback</h2>
            <Feedback
              correctResponse={splitResponse[0]}
              wrongResponse={splitResponse[1]}
              moreInfo={splitResponse[2]}
            />
          </>
        )}

        <Accordion
          type="single"
          collapsible
          defaultValue={isLoading || completion ? undefined : "answer"}
        >
          <AccordionItem value="answer">
            <AccordionTrigger className="px-2 font-semibold">
              Answer
            </AccordionTrigger>
            <AccordionContent className="rounded-md bg-gray-100 p-4">
              {answer}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
};

const Feedback = ({
  correctResponse,
  wrongResponse,
  moreInfo,
}: {
  correctResponse?: string | null;
  wrongResponse?: string | null;
  moreInfo?: string | null;
}) => {
  return (
    <div className="space-y-4">
      {correctResponse && (
        <div className="rounded-md bg-[#f0fff4] p-4">
          <h4 className="mb-2 flex items-center text-sm font-semibold text-green-700">
            <CheckCircleIcon className="mr-2" />
            What you got right
          </h4>
          <p className="text-sm">{correctResponse}</p>
        </div>
      )}
      {wrongResponse && (
        <div className="rounded-md bg-[#fef2f2] p-4">
          <h4 className="mb-2 flex items-center text-sm font-semibold text-red-700">
            <BugIcon className="mr-2" />
            What you got wrong
          </h4>
          <p className="text-sm">{wrongResponse}</p>
        </div>
      )}
      {moreInfo && (
        <div className="rounded-md bg-[#ebf4ff] p-4">
          <h4 className="mb-2 flex items-center text-sm font-semibold text-blue-700">
            <InfoIcon className="mr-2" />
            More info
          </h4>
          <p className="text-sm">{moreInfo}</p>
        </div>
      )}
    </div>
  );
};
