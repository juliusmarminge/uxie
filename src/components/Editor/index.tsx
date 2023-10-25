import {
  BlockNoteView,
  FormattingToolbarPositioner,
  DefaultFormattingToolbar,
  defaultBlockTypeDropdownItems,
  HyperlinkToolbarPositioner,
  SlashMenuPositioner,
  SideMenuPositioner,
  ImageToolbarPositioner,
} from "@blocknote/react";
import { AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";

function Editor({ editor }: { editor: any }) {
  const { theme } = useTheme();

  return (
    <div className="h-[calc(100vh_-_3rem)] w-full flex-1 overflow-scroll">
      <BlockNoteView
        className="w-full flex-1"
        theme={theme === "dark" ? "dark" : "light"}
        editor={editor}
      >
        <FormattingToolbarPositioner
          editor={editor}
          formattingToolbar={(props) => (
            <DefaultFormattingToolbar
              {...props}
              blockTypeDropdownItems={[
                ...defaultBlockTypeDropdownItems,
                {
                  name: "Alert",
                  type: "alert",
                  icon: AlertCircle as any,
                  isSelected: (block) => block.type === "alert",
                },
              ]}
            />
          )}
        />
        <HyperlinkToolbarPositioner editor={editor} />
        <SlashMenuPositioner editor={editor} />
        <SideMenuPositioner editor={editor} />
        <ImageToolbarPositioner editor={editor} />
      </BlockNoteView>
    </div>
  );
}

export default Editor;