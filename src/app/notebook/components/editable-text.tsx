"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import ColorPickerComponent from "./color-picker";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered,
  Link,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Heading3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditableText() {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);

  // States for formatting
  const [color, setColor] = useState<string>("#ff0000");
  const [appliedTheme, setAppliedTheme] = useState<string>("");
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<string>("16px");
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "Select some text and pick a color.";
    }
  }, []);

  useEffect(() => {
    if (resolvedTheme) {
      setAppliedTheme(resolvedTheme);
    }
  }, [resolvedTheme]);

  // Store text selection before applying styles
  const storeSelection = () => {
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0);
    }
  };

  // Utility function to remove previous `<span>` tags but retain text
  const cleanTextContent = (node: Node): string => {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "SPAN") {
      return node.textContent || "";
    }
    if (node.hasChildNodes()) {
      return Array.from(node.childNodes).map(cleanTextContent).join("");
    }
    return node.textContent || "";
  };

  // Check if all text is selected
  const isAllTextSelected = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return false;
    return selection.toString().trim() === editorRef.current.innerText.trim();
  };

  // Check if selected text is fully wrapped in a span
  const isWrappedInSpan = (range: Range): HTMLElement | null => {
    const parentElement = range.commonAncestorContainer.parentElement;
    if (
      parentElement &&
      parentElement.tagName === "SPAN" &&
      parentElement.textContent?.trim() === range.toString().trim()
    ) {
      return parentElement; // Found an existing span
    }
    return null;
  };

  // Add undo/redo functionality
  const saveToUndoStack = () => {
    if (editorRef.current) {
      undoStackRef.current.push(editorRef.current.innerHTML);
      redoStackRef.current = []; // Clear redo stack when new changes are made
    }
  };

  const undo = () => {
    if (undoStackRef.current.length > 0) {
      const currentState = editorRef.current?.innerHTML;
      if (currentState) {
        redoStackRef.current.push(currentState);
      }
      const previousState = undoStackRef.current.pop();
      if (editorRef.current && previousState) {
        editorRef.current.innerHTML = previousState;
      }
    }
  };

  const redo = () => {
    if (redoStackRef.current.length > 0) {
      const currentState = editorRef.current?.innerHTML;
      if (currentState) {
        undoStackRef.current.push(currentState);
      }
      const nextState = redoStackRef.current.pop();
      if (editorRef.current && nextState) {
        editorRef.current.innerHTML = nextState;
      }
    }
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            setIsBold(!isBold);
            applyFormatting('bold');
            break;
          case 'i':
            e.preventDefault();
            setIsItalic(!isItalic);
            applyFormatting('italic');
            break;
          case 'u':
            e.preventDefault();
            setIsUnderline(!isUnderline);
            applyFormatting('underline');
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isBold, isItalic, isUnderline]);

  // Modify applyFormatting to handle new formatting options
  const applyFormatting = (
    formatType?: "bold" | "italic" | "underline" | "color" | "fontSize" | "fontFamily" | "textAlign" | "list" | "link",
    value?: string
  ) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    if (selectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }

    const range = selection.getRangeAt(0);
    saveToUndoStack();

    // Handle universal formatting (when no text is selected)
    if (range.collapsed) {
      switch (formatType) {
        case "textAlign":
          if (editorRef.current) {
            editorRef.current.style.textAlign = value || "left";
          }
          break;
        case "fontSize":
          if (editorRef.current && value) {
            editorRef.current.style.fontSize = value;
          }
          break;
        case "fontFamily":
          if (editorRef.current && value) {
            editorRef.current.style.fontFamily = value;
          }
          break;
        default:
          // For other formatting types, create a new paragraph with default formatting
          const p = document.createElement("p");
          p.style.fontWeight = isBold ? "bold" : "normal";
          p.style.fontStyle = isItalic ? "italic" : "normal";
          p.style.textDecoration = isUnderline ? "underline" : "none";
          if (isUnderline) {
            p.style.textDecorationColor = color;
          }
          p.style.color = color;
          p.style.fontSize = fontSize;
          p.style.fontFamily = fontFamily;
          p.textContent = "New paragraph";
          range.insertNode(p);
          // Move cursor to end of new paragraph
          range.setStartAfter(p);
          range.setEndAfter(p);
          selection.removeAllRanges();
          selection.addRange(range);
      }
      return;
    }

    // Handle selected text formatting
    switch (formatType) {
      case "list":
        const list = document.createElement(value === "ordered" ? "ol" : "ul");
        const li = document.createElement("li");
        li.textContent = range.toString();
        list.appendChild(li);
        range.deleteContents();
        range.insertNode(list);
        break;

      case "link":
        const link = document.createElement("a");
        // Format URL properly
        let formattedUrl = value || "#";
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = 'https://' + formattedUrl;
        }
        link.href = formattedUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = range.toString();
        link.style.textDecoration = "underline";
        link.style.textDecorationColor = "#3f72c4";
        link.style.cursor = "pointer";
        link.style.color = "#3f72c4";
        
        // Add click handler
        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.open(formattedUrl, '_blank');
        });
        
        range.deleteContents();
        range.insertNode(link);
        break;

      case "textAlign":
        if (editorRef.current) {
          editorRef.current.style.textAlign = value || "left";
        }
        break;

      default:
        // Check if the selection is already wrapped in a span
        let targetElement: HTMLElement;
        const parentSpan = range.commonAncestorContainer.parentElement;
        
        if (parentSpan?.tagName === "SPAN") {
          // Use existing span
          targetElement = parentSpan;
        } else {
          // Create new span only if needed
          const span = document.createElement("span");
          span.textContent = range.toString();
          range.deleteContents();
          range.insertNode(span);
          targetElement = span;
        }

        // Apply styles to the target element based on formatType
        switch (formatType) {
          case "bold":
            const newBoldState = !isBold;
            targetElement.style.fontWeight = newBoldState ? "bold" : "normal";
            setIsBold(newBoldState);
            break;
          case "italic":
            const newItalicState = !isItalic;
            targetElement.style.fontStyle = newItalicState ? "italic" : "normal";
            setIsItalic(newItalicState);
            break;
          case "underline":
            const newUnderlineState = !isUnderline;
            targetElement.style.textDecoration = newUnderlineState ? "underline" : "none";
            if (newUnderlineState) {
              targetElement.style.textDecorationColor = color;
            }
            setIsUnderline(newUnderlineState);
            break;
          case "color":
            if (value) {
              targetElement.style.color = value;
              targetElement.style.textDecorationColor = value;
            }
            break;
          case "fontSize":
            if (value) {
              targetElement.style.fontSize = value;
            }
            break;
          case "fontFamily":
            if (value) {
              targetElement.style.fontFamily = value;
            }
            break;
          default:
            // Apply all current formatting states
            targetElement.style.fontWeight = isBold ? "bold" : "normal";
            targetElement.style.fontStyle = isItalic ? "italic" : "normal";
            targetElement.style.textDecoration = isUnderline ? "underline" : "none";
            if (isUnderline) {
              targetElement.style.textDecorationColor = color;
            }
            targetElement.style.color = color;
            targetElement.style.fontSize = fontSize;
            targetElement.style.fontFamily = fontFamily;
        }
    }

    selection.removeAllRanges();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background">
        <div className="flex items-center gap-1 border-r pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyFormatting('bold')}
            className={isBold ? "bg-accent" : ""}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyFormatting('italic')}
            className={isItalic ? "bg-accent" : ""}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyFormatting('underline')}
            className={isUnderline ? "bg-accent" : ""}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTextAlign("left");
              applyFormatting("textAlign", "left");
            }}
            className={textAlign === "left" ? "bg-accent" : ""}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTextAlign("center");
              applyFormatting("textAlign", "center");
            }}
            className={textAlign === "center" ? "bg-accent" : ""}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTextAlign("right");
              applyFormatting("textAlign", "right");
            }}
            className={textAlign === "right" ? "bg-accent" : ""}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2">
          <Select
            value={fontSize}
            onValueChange={(value: string) => {
              setFontSize(value);
              applyFormatting("fontSize", value);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Font Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12px">12px</SelectItem>
              <SelectItem value="14px">14px</SelectItem>
              <SelectItem value="16px">16px</SelectItem>
              <SelectItem value="18px">18px</SelectItem>
              <SelectItem value="24px">24px</SelectItem>
              <SelectItem value="32px">32px</SelectItem>
              <SelectItem value="48px">48px</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={fontFamily}
            onValueChange={(value: string) => {
              setFontFamily(value);
              applyFormatting("fontFamily", value);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Font Family" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 border-r pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyFormatting("list", "unordered")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyFormatting("list", "ordered")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const url = prompt("Enter URL:");
              if (url) applyFormatting("link", url);
            }}
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning={true}
        onMouseUp={storeSelection}
        onKeyUp={storeSelection}
        className="p-4 min-h-[70vh] w-full rounded-md border bg-background"
        style={{
          backgroundColor: appliedTheme === "dark" ? "#333" : "#fff",
          color: appliedTheme === "dark" ? "#fff" : "#000",
        }}
      />

      {/* Color Picker */}
      <ColorPickerComponent
        changeSelectedTextColor={(newColor: string) => applyFormatting("color", newColor)}
        getSelectedColor={setColor}
      />
    </div>
  );
}
