import {
  AtSign, BookOpen, Brain, Briefcase, Bug, CircuitBoard, ClipboardCheck, Clock, Code, Cog, Compass, Cpu, Database,
  FileSearch, FileText, FileUser, FlaskConical, FolderKanban, FolderTree, GitBranch, GitPullRequest, Globe,
  GraduationCap, Layers, Leaf, MessageCircleQuestionMark, MessagesSquare, Mic, Network, NotebookPen, PenLine,
  Presentation, Rocket, Router, Sprout, SquareTerminal, Target, Telescope, Users, BookMarked, CirclePlay, Newspaper,
  Wrench, LayoutTemplate, Book,
} from 'lucide-react';

// Icon names stored in server/content.js map to components here.
const ICONS = {
  AtSign, BookOpen, Brain, Briefcase, Bug, CircuitBoard, ClipboardCheck, Clock, Code, Cog, Compass, Cpu, Database,
  FileSearch, FileText, FileUser, FlaskConical, FolderKanban, FolderTree, GitBranch, GitPullRequest, Globe,
  GraduationCap, Layers, Leaf, MessageCircleQuestionMark, MessagesSquare, Mic, Network, NotebookPen, PenLine,
  Presentation, Rocket, Router, Sprout, SquareTerminal, Target, Telescope, Users,
};

export function Icon({ name, ...props }) {
  const Component = ICONS[name] || BookMarked;
  return <Component aria-hidden="true" {...props} />;
}

// Labels live in i18n.jsx under type.<name> and types.<name>.
export const RESOURCE_TYPES = {
  video: CirclePlay,
  article: Newspaper,
  course: GraduationCap,
  book: Book,
  tool: Wrench,
  template: LayoutTemplate,
};
