import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ReportRenderer({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-zinc max-w-none
      prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight
      prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-2
      prose-h3:text-xl prose-h3:mt-8
      prose-p:leading-relaxed prose-p:text-muted-foreground
      prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline
      prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-blockquote:rounded-r-lg
      prose-ul:list-outside prose-ul:pl-6 prose-ul:space-y-2
      prose-li:text-muted-foreground prose-li:marker:text-muted
      prose-strong:text-foreground prose-strong:font-semibold
      prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-muted/50 prose-pre:text-foreground prose-pre:border prose-pre:border-border/50 prose-pre:shadow-sm
      prose-table:w-full prose-table:my-8 prose-table:overflow-x-auto prose-table:border-collapse prose-table:text-sm prose-table:block
      prose-th:border prose-th:border-border/50 prose-th:bg-muted/50 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
      prose-td:border prose-td:border-border/50 prose-td:px-4 prose-td:py-3 prose-td:align-top
      prose-hr:border-border/50 prose-hr:my-8
      prose-img:rounded-lg prose-img:border prose-img:border-border/50 prose-img:shadow-sm"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
