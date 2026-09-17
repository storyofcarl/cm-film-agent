import Studio from "../components/Studio";
import { sampleProject } from "../lib/sample";
export default function Demo({ project }) {
  return <Studio initialProject={project} demo />;
}
export function getServerSideProps() {
  return { props: { project: sampleProject() } };
}
