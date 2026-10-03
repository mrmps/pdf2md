import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FaqSection() {
  return (
    <div>
      <h2 className="text-lg font-medium text-foreground mb-4">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-b border-border">
          <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
            How does the conversion work?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground pb-4">
            <p className="mb-2">
              This tool uses the <code className="text-xs bg-muted px-1 py-0.5 rounded">@opendocsg/pdf2md</code> library to convert PDF documents to Markdown.
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Select or drop one or more PDF files, processed entirely in your browser</li>
              <li>The content is extracted, including text and structure</li>
              <li>The extracted content is converted to Markdown syntax</li>
              <li>Copy or download each Markdown result, or download all successful results as a ZIP</li>
            </ol>
            <p className="mt-2">
              <strong>Your files never leave your device</strong> - all processing happens locally.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border-b border-border">
          <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
            What are the limitations?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground pb-4">
            <ul className="list-disc pl-5 space-y-1">
              <li>Complex layouts may not be preserved exactly</li>
              <li>Tables might not convert perfectly, especially with merged cells</li>
              <li>Images are not included in the Markdown output</li>
              <li>Forms, annotations, and comments are not supported</li>
              <li>Multi-column documents may have text flow issues</li>
            </ul>
            <p className="mt-2">For best results, use PDFs with simple layouts and primarily text content.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border-b border-border">
          <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
            What formatting is preserved?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground pb-4">
            <ul className="list-disc pl-5 space-y-1">
              <li>Headings and subheadings</li>
              <li>Paragraphs and basic text flow</li>
              <li>Bulleted and numbered lists</li>
              <li>Simple tables</li>
              <li>Bold and italic text (when detectable)</li>
              <li>Links (when properly embedded)</li>
            </ul>
            <p className="mt-2">
              Colors, fonts, text size, and alignment are not preserved in Markdown.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border-b border-border">
          <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
            Is there a file size limit?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground pb-4">
            <p>
              The maximum file size is 10MB per PDF. You can select multiple files; they are converted one at a time in your browser. If one file fails, the remaining files still continue.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border-b border-border">
          <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
            Is my data secure?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground pb-4">
            <ul className="list-disc pl-5 space-y-1">
              <li>100% browser-based - files never leave your device</li>
              <li>No data is uploaded to any server</li>
              <li>Works offline after the page loads</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6" className="border-b border-border">
          <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
            Which browsers are supported?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground pb-4">
            <p>All modern browsers are supported: Chrome, Firefox, Edge, Safari, and Opera. For the best experience, use the latest version.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7" className="border-b-0">
          <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
            Can I use this commercially?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground pb-4">
            <p>
              Yes, this tool can be used for personal and commercial purposes. The underlying library (@opendocsg/pdf2md) has its own license terms.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
