import PromptField from "./PromptField";

export default function ProposalReview({ project, proposal }) {
  const objects = [...project.nodes, ...project.assets, ...project.shots];
  const groups = [
    ["New containers", proposal.nodes],
    ["New assets", proposal.assets],
    ["New shots", proposal.shots],
    ["Asset and shot changes", proposal.updates],
    ["Container changes", proposal.nodeUpdates],
  ];
  return (
    <div className="proposal-review">
      {proposal.project && (
        <section>
          <h4>Project changes</h4>
          {["title", "brief", "globalStyle"]
            .filter((key) => proposal.project[key] != null)
            .map((key) => (
              <p key={key}>
                <b>{key === "globalStyle" ? "Global style" : key}:</b>{" "}
                {proposal.project[key]}
              </p>
            ))}
          {Object.entries(proposal.project.settings || {}).map(
            ([key, value]) => (
              <p key={key}>
                <b>{key.replace(/([A-Z])/g, " $1")}:</b>{" "}
                {typeof value === "object"
                  ? Object.values(value).join(", ")
                  : String(value)}
              </p>
            ),
          )}
        </section>
      )}
      {groups
        .filter(([, entries]) => entries?.length)
        .map(([label, entries]) => (
          <section key={label}>
            <h4>
              {label} · {entries.length}
            </h4>
            {entries.map((entry, index) => {
              const current = objects.find((object) => object.id === entry.id);
              return (
                <details key={entry.id || index}>
                  <summary>
                    {current?.code ? `${current.code} · ` : ""}
                    {entry.title || current?.title || `Change ${index + 1}`}
                    {entry.type ? ` · ${entry.type}` : ""}
                  </summary>
                  {entry.description && <p>{entry.description}</p>}
                  {entry.duration != null && <p>Runtime: {entry.duration}s</p>}
                  {entry.location && <p>Location: {entry.location}</p>}
                  {entry.time && <p>Time: {entry.time}</p>}
                  {entry.prompt != null && (
                    <PromptField
                      label="Proposed direction"
                      value={entry.prompt}
                      readOnly
                      rows={5}
                    />
                  )}
                  {entry.assetIds && (
                    <p>
                      Asset references:{" "}
                      {entry.assetIds
                        .map(
                          (id) =>
                            objects.find((object) => object.id === id)?.title ||
                            proposal.assets?.find((asset) => asset.id === id)
                              ?.title ||
                            id,
                        )
                        .join(", ") || "None"}
                    </p>
                  )}
                </details>
              );
            })}
          </section>
        ))}
    </div>
  );
}
