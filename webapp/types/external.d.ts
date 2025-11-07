declare module "react-markdown" {
  import type { ComponentType, ReactNode } from "react"
  interface ReactMarkdownProps {
    children?: ReactNode
    className?: string
  }
  const ReactMarkdown: ComponentType<ReactMarkdownProps>
  export default ReactMarkdown
}


