import { useState } from "react";
import PromptField from "./PromptField";
import {
  creativePath,
  contextShots,
  effectiveAssetIds,
  findItem,
} from "../lib/domain";

export default function ObjectProperties({ project, targetId, busy, command }) {
  const target =
    findItem(project, targetId) ||
    project.nodes.find((node) => node.id === targetId) ||
    project;
  const isProject = target === project;
  const isAsset = target.kind === "asset";
  const isShot = target.kind === "shot";
  const isContainer = !isProject && !isAsset && !isShot;
  const [referenceMode, setReferenceMode] = useState(
    Array.isArray(target.assetIds) ? "explicit" : "inherit",
  );
  const [saved, setSaved] = useState(false);
  const shots = isAsset ? [] : contextShots(project, target.id);
  const ancestors = creativePath(project, target.id).filter(
    (entry) => entry.id !== target.id,
  );
  const references =
    referenceMode === "inherit"
      ? isProject
        ? project.assets.map((asset) => asset.id)
        : effectiveAssetIds(project, ancestors.at(-1)?.id || project.id)
      : effectiveAssetIds(project, target.id);
  return (
    <section
      className="object-properties"
      aria-label="Selected object properties"
    >
      <div className="inspector-title">
        <span className="eyebrow">
          {target.kind || target.type || project.scope} PROPERTIES
        </span>
        <h2>{target.title}</h2>
        <span className="object-code">{target.code || target.id}</span>
      </div>
      <p className="property-help">
        These properties belong to this object across every view. Saving changes
        future preparation; recorded version recipes stay intact.
      </p>
      <form
        onChange={() => setSaved(false)}
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const payload = {
            id: target.id,
            title: data.get("title"),
            [isProject ? "globalStyle" : "prompt"]: data.get("prompt"),
          };
          if (isProject) payload.brief = data.get("brief");
          if (isShot) payload.duration = Number(data.get("duration"));
          if (isAsset) payload.type = data.get("assetType");
          if (isContainer) payload.order = Number(data.get("order"));
          if (target.type === "scene") {
            payload.location = data.get("location");
            payload.time = data.get("time");
          }
          if (!isAsset)
            payload.assetIds =
              referenceMode === "inherit" ? null : data.getAll("assets");
          const result = await command(
            isProject
              ? "project.update"
              : target.kind
                ? "item.update"
                : "node.update",
            payload,
          );
          setSaved(Boolean(result));
        }}
      >
        <label className="field">
          Object title
          <input name="title" required defaultValue={target.title} />
        </label>
        {isContainer && (
          <label className="field">
            Position among siblings
            <input
              name="order"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={target.order}
            />
          </label>
        )}
        {isAsset && (
          <label className="field">
            Asset type
            <select name="assetType" defaultValue={target.type || "character"}>
              {[
                "character",
                "location",
                "prop",
                "creature",
                "vehicle",
                "wardrobe",
                "other",
              ].map((type) => (
                <option key={type} value={type}>
                  {type[0].toUpperCase() + type.slice(1)}
                </option>
              ))}
              {target.type &&
                ![
                  "character",
                  "location",
                  "prop",
                  "creature",
                  "vehicle",
                  "wardrobe",
                  "other",
                ].includes(target.type) && (
                  <option value={target.type}>{target.type}</option>
                )}
            </select>
          </label>
        )}
        {!isAsset &&
          (isShot ? (
            <label className="field">
              Planned runtime (seconds)
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="duration"
                required
                defaultValue={target.duration}
              />
            </label>
          ) : (
            <dl className="recipe-meta">
              <dt>Planned runtime</dt>
              <dd>
                {shots
                  .reduce((sum, shot) => sum + Number(shot.duration), 0)
                  .toFixed(2)}
                s
              </dd>
              <dt>Shots</dt>
              <dd>{shots.length}</dd>
            </dl>
          ))}
        {!isAsset && !isShot && (
          <p className="property-help">
            Runtime is the sum of the contained shots.
          </p>
        )}
        {isShot && target.beats?.length > 0 && (
          <p className="property-help">
            Timed action beats must still add up to the runtime. Edit their
            timing with Edit shot intent.
          </p>
        )}
        {isProject && (
          <label className="field">
            Brief
            <textarea name="brief" rows={4} defaultValue={project.brief} />
          </label>
        )}
        {target.type === "scene" && (
          <>
            <label className="field">
              Location
              <input name="location" defaultValue={target.location || ""} />
            </label>
            <label className="field">
              Time
              <input name="time" defaultValue={target.time || ""} />
            </label>
          </>
        )}
        <PromptField
          label={
            isProject ? "Global style prompt" : "Object prompt / direction"
          }
          name="prompt"
          rows={5}
          maxLength={40000}
          defaultValue={isProject ? project.globalStyle : target.prompt || ""}
        />
        {!isProject && !isAsset && (
          <details className="inherited-properties">
            <summary>Inherited direction</summary>
            {ancestors.map((entry) => (
              <div key={entry.id}>
                <b>{entry.title}</b>
                <p>
                  {entry === project
                    ? project.globalStyle || "No global style set."
                    : entry.prompt || "No local direction set."}
                </p>
              </div>
            ))}
          </details>
        )}
        {!isAsset && (
          <>
            <label className="field">
              Asset reference scope
              <select
                value={referenceMode}
                onChange={(event) => setReferenceMode(event.target.value)}
              >
                <option value="inherit">
                  {isProject
                    ? "All project assets (default)"
                    : "Inherit from parent"}
                </option>
                <option value="explicit">Choose for this object</option>
              </select>
            </label>
            {referenceMode === "explicit" && (
              <fieldset className="property-references">
                <legend>Assigned assets</legend>
                {project.assets.map((asset) => (
                  <label key={asset.id}>
                    <input
                      type="checkbox"
                      name="assets"
                      value={asset.id}
                      defaultChecked={(target.assetIds || references).includes(
                        asset.id,
                      )}
                    />
                    {asset.title}
                  </label>
                ))}
                {!project.assets.length && <p>No assets added yet.</p>}
              </fieldset>
            )}
            <p className="property-help">
              {referenceMode === "inherit"
                ? `Effective references: ${
                    project.assets
                      .filter((asset) => references.includes(asset.id))
                      .map((asset) => asset.title)
                      .join(", ") || "None"
                  }.`
                : "This selection overrides inherited references. An empty selection means no asset references."}{" "}
              Approval is still required before generation uses a reference.
            </p>
          </>
        )}
        <button className="primary full" type="submit" disabled={busy}>
          Save object properties
        </button>
        {saved && (
          <p role="status" className="property-help">
            Properties saved.
          </p>
        )}
      </form>
    </section>
  );
}
