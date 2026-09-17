import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { InspectDialog } from "./PromptField";
import { crewNextActions } from "../lib/crewActions";
import ProposalReview from "./ProposalReview";
import UploadInbox from "./UploadInbox";

export function directorMessage(artifact) {
  return (
    artifact.instruction ||
    (artifact.prompt?.startsWith("DIRECTOR'S REQUEST\n")
      ? artifact.prompt
          .split("\n\nCURRENT PRODUCTION")[0]
          .slice("DIRECTOR'S REQUEST\n".length)
      : null)
  );
}

export default function CrewConversation({
  project,
  busy,
  command,
  prepare,
  openDocument,
}) {
  const log = useRef(null);
  const [expanded, setExpanded] = useState(null);
  const messages = project.artifacts.filter((artifact) =>
    directorMessage(artifact),
  );
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages.length]);
  const reply = (artifact) => (
    <>
      <div className="crew-reply">
        <ReactMarkdown>{artifact.content}</ReactMarkdown>
      </div>
      {artifact.documentIds?.map((id) => {
        const document = project.artifacts.find((entry) => entry.id === id);
        return (
          document && (
            <button
              type="button"
              className="text-button document-link"
              key={id}
              onClick={() => {
                openDocument(document);
                setExpanded(null);
              }}
            >
              {document.title} · V{document.number}
            </button>
          )
        );
      })}
      {artifact.documentWarnings?.map((warning, index) => (
        <p className="gate-message" key={index}>
          {warning}
        </p>
      ))}
      {!!artifact.unfiledDocuments?.length && (
        <details>
          <summary>Unfiled document output</summary>
          <pre className="unfiled-document-output">
            {JSON.stringify(artifact.unfiledDocuments, null, 2)}
          </pre>
        </details>
      )}
      {artifact.decisions?.length > 0 && (
        <p className="gate-message">
          Working decisions: {artifact.decisions.join(" · ")}
        </p>
      )}
      {artifact.proposal && (
        <>
          <details>
            <summary>Review proposed changes</summary>
            <ProposalReview {...{ project }} proposal={artifact.proposal} />
          </details>
          <button
            type="button"
            className="secondary full"
            disabled={busy || Boolean(artifact.appliedAt)}
            onClick={() => command("artifact.apply", { id: artifact.id })}
          >
            {artifact.appliedAt
              ? "Proposal applied"
              : "Apply proposed production changes"}
          </button>
        </>
      )}
      {crewNextActions(artifact.nextActions).map((action, index) => (
        <div key={`${action.kind}:${index}`} className="crew-next-action">
          <p>{action.reason}</p>
          <button
            type="button"
            className="secondary full"
            disabled={busy}
            onClick={() => prepare(action.kind)}
          >
            {action.title}
          </button>
          <small>Prepare for review · no generation submitted</small>
        </div>
      ))}
    </>
  );
  return (
    <>
      <UploadInbox {...{ project, busy, command }} />
      {project.artifacts.some((entry) => entry.origin === "imported") && (
        <details className="crew-uploads">
          <summary>
            Supplied work ·{" "}
            {
              project.artifacts.filter((entry) => entry.origin === "imported")
                .length
            }{" "}
            documents
          </summary>
          {project.artifacts
            .filter((entry) => entry.origin === "imported")
            .map((entry) => (
              <p key={entry.id}>
                {entry.title} ·{" "}
                {entry.review === "approved"
                  ? "Approved"
                  : "Needs completeness review"}
              </p>
            ))}
        </details>
      )}
      <div
        ref={log}
        className="crew-conversation"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
      >
        {!messages.length && <p>Plan, create, or revise your project.</p>}
        {messages.map((artifact) => (
          <article key={artifact.id}>
            <div className="crew-message director-message">
              <b>You</b>
              <p className="crew-message-text">{directorMessage(artifact)}</p>
            </div>
            <div className="crew-message">
              <b>Assistant</b>
              {artifact.context?.title && (
                <small>{artifact.context.title}</small>
              )}
              {reply(artifact)}
              <button
                type="button"
                className="text-button"
                onClick={() => setExpanded(artifact.id)}
              >
                Expand reply
              </button>
            </div>
          </article>
        ))}
      </div>
      {expanded && (
        <InspectDialog title="Reply" onClose={() => setExpanded(null)}>
          {reply(
            project.artifacts.find((artifact) => artifact.id === expanded),
          )}
        </InspectDialog>
      )}
    </>
  );
}
