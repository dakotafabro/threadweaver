export interface KnowledgeProvider {
  listProjects(): Promise<Array<{ id: string; name: string }>>;
  searchThreads(projectId: string, query: string): Promise<Array<{ id: string; title: string; snippet: string }>>;
  exportMarkdown(threadId: string): Promise<string>;
}
