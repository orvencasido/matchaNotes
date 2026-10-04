import React from 'react'
import { Check } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  onContentChange?: (updatedContent: string) => void
  onImageClick?: (src: string, alt: string) => void
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onContentChange,
  onImageClick,
}) => {
  if (!content.trim()) {
    return (
      <div className="text-sm text-[#8A968F] italic py-4">
        Empty note. Switch to Edit mode to start writing.
      </div>
    )
  }

  const lines = content.split('\n')

  const handleToggleTask = (lineIndex: number) => {
    if (!onContentChange) return

    const line = lines[lineIndex]
    let updatedLine = line

    if (/^(\s*[-*]\s*)\[\s*\]/i.test(line)) {
      // Toggle unchecked to checked
      updatedLine = line.replace(/^(\s*[-*]\s*)\[\s*\]/i, '$1[x]')
    } else if (/^(\s*[-*]\s*)\[x\]/i.test(line)) {
      // Toggle checked to unchecked
      updatedLine = line.replace(/^(\s*[-*]\s*)\[x\]/i, '$1[ ]')
    }

    const updatedLines = [...lines]
    updatedLines[lineIndex] = updatedLine
    onContentChange(updatedLines.join('\n'))
  }

  // Parse inline markdown tokens: bold, italic, inline code, link, image
  const renderInlineFormatted = (text: string): React.ReactNode => {
    // Regex for inline elements
    const parts: React.ReactNode[] = []
    let remaining = text
    let keyIdx = 0

    while (remaining.length > 0) {
      // 1. Image: ![alt](url)
      const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
      if (imgMatch) {
        const alt = imgMatch[1]
        const src = imgMatch[2]
        parts.push(
          <img
            key={keyIdx++}
            src={src}
            alt={alt}
            onClick={() => onImageClick?.(src, alt)}
            className="rounded-lg border border-[#E4E3DC] my-2 max-h-72 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            loading="lazy"
          />
        )
        remaining = remaining.slice(imgMatch[0].length)
        continue
      }

      // 2. Link: [label](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        const label = linkMatch[1]
        const href = linkMatch[2]
        parts.push(
          <a
            key={keyIdx++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2D4739] font-medium underline underline-offset-2 hover:text-[#4E6E58] transition-colors"
          >
            {label}
          </a>
        )
        remaining = remaining.slice(linkMatch[0].length)
        continue
      }

      // 3. Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/)
      if (codeMatch) {
        parts.push(
          <code
            key={keyIdx++}
            className="bg-[#F4F3EE] px-1.5 py-0.5 rounded font-mono text-[12px] text-[#23392D] border border-[#E4E3DC]"
          >
            {codeMatch[1]}
          </code>
        )
        remaining = remaining.slice(codeMatch[0].length)
        continue
      }

      // 4. Bold: **text** or __text__
      const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/)
      if (boldMatch) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-[#19221C]">
            {boldMatch[2]}
          </strong>
        )
        remaining = remaining.slice(boldMatch[0].length)
        continue
      }

      // 5. Italic: *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)(.*?)\1/)
      if (italicMatch) {
        parts.push(
          <em key={keyIdx++} className="italic text-[#5C6861]">
            {italicMatch[2]}
          </em>
        )
        remaining = remaining.slice(italicMatch[0].length)
        continue
      }

      // Plain character or text chunk until next markdown symbol
      const nextSpecial = remaining.search(/([![`*_])/)
      if (nextSpecial === -1) {
        parts.push(remaining)
        break
      } else if (nextSpecial === 0) {
        parts.push(remaining[0])
        remaining = remaining.slice(1)
      } else {
        parts.push(remaining.slice(0, nextSpecial))
        remaining = remaining.slice(nextSpecial)
      }
    }

    return parts
  }

  // Group code blocks or lines
  const renderedElements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBlockBuffer: string[] = []

  lines.forEach((line, index) => {
    // Fenced code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        renderedElements.push(
          <pre
            key={`code-${index}`}
            className="bg-[#F4F3EE] p-3.5 rounded-xl font-mono text-xs text-[#19221C] overflow-x-auto border border-[#E4E3DC] my-3 leading-relaxed"
          >
            <code>{codeBlockBuffer.join('\n')}</code>
          </pre>
        )
        codeBlockBuffer = []
        inCodeBlock = false
      } else {
        // Start code block
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line)
      return
    }

    // Task checkbox: - [ ] or - [x]
    const taskMatch = line.match(/^(\s*)[-*]\s*\[([ xX])\]\s*(.*)$/)
    if (taskMatch) {
      const isChecked = taskMatch[2].toLowerCase() === 'x'
      const taskText = taskMatch[3]

      renderedElements.push(
        <div
          key={`task-${index}`}
          className="flex items-start gap-2.5 py-1.5 group select-none cursor-pointer"
          onClick={() => handleToggleTask(index)}
        >
          <button
            type="button"
            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isChecked
                ? 'bg-[#2D4739] border-[#2D4739] text-[#FBFBF9]'
                : 'border-[#5C6861]/50 bg-[#FBFBF9] hover:border-[#2D4739] group-hover:border-[#2D4739]'
            }`}
            aria-label={isChecked ? 'Mark incomplete' : 'Mark complete'}
          >
            {isChecked && <Check className="w-3 h-3 stroke-[2.5]" />}
          </button>
          <span
            className={`text-sm leading-relaxed transition-colors ${
              isChecked ? 'line-through text-[#8A968F]' : 'text-[#19221C]'
            }`}
          >
            {renderInlineFormatted(taskText)}
          </span>
        </div>
      )
      return
    }

    // Headings
    if (line.startsWith('# ')) {
      renderedElements.push(
        <h1
          key={`h1-${index}`}
          className="text-xl sm:text-2xl font-semibold text-[#19221C] tracking-tight mt-5 mb-2 first:mt-0"
        >
          {renderInlineFormatted(line.slice(2))}
        </h1>
      )
      return
    }

    if (line.startsWith('## ')) {
      renderedElements.push(
        <h2
          key={`h2-${index}`}
          className="text-lg sm:text-xl font-semibold text-[#19221C] tracking-tight mt-4 mb-1.5 first:mt-0"
        >
          {renderInlineFormatted(line.slice(3))}
        </h2>
      )
      return
    }

    if (line.startsWith('### ')) {
      renderedElements.push(
        <h3
          key={`h3-${index}`}
          className="text-base font-semibold text-[#19221C] tracking-tight mt-3 mb-1 first:mt-0"
        >
          {renderInlineFormatted(line.slice(4))}
        </h3>
      )
      return
    }

    // Blockquote
    if (line.startsWith('> ')) {
      renderedElements.push(
        <blockquote
          key={`quote-${index}`}
          className="border-l-3 border-[#4E6E58] pl-3.5 italic text-[#5C6861] my-2 text-sm"
        >
          {renderInlineFormatted(line.slice(2))}
        </blockquote>
      )
      return
    }

    // Unordered bullet list: - item or * item
    if (/^[-*]\s+(.*)$/.test(line)) {
      const itemText = line.replace(/^[-*]\s+/, '')
      renderedElements.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2.5 py-0.5 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4E6E58] mt-2 shrink-0" />
          <span className="text-sm text-[#19221C] leading-relaxed">
            {renderInlineFormatted(itemText)}
          </span>
        </div>
      )
      return
    }

    // Numbered list: 1. item
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/)
    if (numMatch) {
      renderedElements.push(
        <div key={`num-${index}`} className="flex items-start gap-2 py-0.5 ml-1">
          <span className="font-mono text-xs text-[#5C6861] mt-0.5 min-w-[1.2rem]">
            {numMatch[1]}.
          </span>
          <span className="text-sm text-[#19221C] leading-relaxed">
            {renderInlineFormatted(numMatch[2])}
          </span>
        </div>
      )
      return
    }

    // Empty line / paragraph break
    if (!line.trim()) {
      renderedElements.push(<div key={`empty-${index}`} className="h-3" />)
      return
    }

    // Regular paragraph
    renderedElements.push(
      <p key={`p-${index}`} className="text-sm text-[#19221C] leading-relaxed">
        {renderInlineFormatted(line)}
      </p>
    )
  })

  // Close dangling code block if any
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    renderedElements.push(
      <pre
        key="code-unclosed"
        className="bg-[#F4F3EE] p-3.5 rounded-xl font-mono text-xs text-[#19221C] overflow-x-auto border border-[#E4E3DC] my-3 leading-relaxed"
      >
        <code>{codeBlockBuffer.join('\n')}</code>
      </pre>
    )
  }

  return <div className="space-y-1">{renderedElements}</div>
}
