/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import BatchPanel from "./BatchPanel";
import ObjectProperties from "./ObjectProperties";
import PromptField from "./PromptField";
import GenerationDetails from "./GenerationDetails";
import ProjectFiles from "./ProjectFiles";
import { FILE_AREAS } from "../lib/fileAreas";
import { documentArea } from "../lib/documents";
import CrewConversation from "./CrewConversation";
import PhaseChecklist from "./PhaseChecklist";
import { UPLOAD_ACCEPT } from "../lib/uploads";
import { uploadWork } from "../lib/uploadWork";
import {
  resolveProjectResponse,
  uploadProjectFile,
} from "../lib/projectTransfer";
import Link from "next/link";
import { useRouter } from "next/router";
import { getBrowserSupabase } from "../../../utils/supabase/browser";
import {
  ReviewGrid,
  HierarchyStrip,
  GuidesPanel,
  DeliveryPanel,
} from "./ProductionViews";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyCommand,
  createProject,
  selectedVersion,
  sceneShots,
  revisionItems,
  REVIEW_LABELS,
  lookdevRequirement,
  sceneIsApproved,
} from "../lib/domain";
import { METHODS, methodLabel } from "../lib/methods";

const paths = {
  film: "M4 4h16v16H4z M4 8h16M4 16h16M8 4v4M16 4v4M8 16v4M16 16v4",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  layers: "m12 3 10 6-10 6L2 9l10-6Zm-9 11 9 5 9-5M3 18l9 5 9-5",
  clock: "M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  plus: "M12 5v14M5 12h14",
  chevron: "m9 5 7 7-7 7",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  play: "m8 4 12 8-12 8V4Z",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  upload: "M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5",
  settings: "M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6",
  close: "m6 6 12 12M6 18 18 6",
  document: "M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6",
  audio:
    "M9 18V5l11-2v13M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0M20 16a3 2 0 1 1-6 0 3 2 0 0 1 6 0",
};
function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.film} />
    </svg>
  );
}
function Badge({ status = "pending" }) {
  return (
    <span className={`badge ${status}`}>
      <i />
      {REVIEW_LABELS[status] || status}
    </span>
  );
}
const jsonFetch = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.error || "Request failed"), {
      status: response.status,
    });
  return resolveProjectResponse(data);
};
const post = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export default function Studio({
  initialProject = null,
  demo = false,
  userEmail = "",
}) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [projects, setProjects] = useState([]);
  const [revision, setRevision] = useState(0);
  const [sceneId, setSceneId] = useState(
    initialProject?.nodes.find((node) => node.type === "scene")?.id || null,
  );
  const [itemId, setItemId] = useState(null);
  const [reviewVersionId, setReviewVersionId] = useState(null);
  const [tab, setTab] = useState("Review");
  const [containerId, setContainerId] = useState(sceneId);
  const [selectedShotId, setSelectedShotId] = useState(itemId);
  const [propertyTargetId, setPropertyTargetId] = useState(
    itemId || sceneId || initialProject?.id || null,
  );
  const [newContainerType, setNewContainerType] = useState("act");
  const [chatOpen, setChatOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState(null);
  const closeModal = useCallback(() => setModal(null), []);
  const [drafts, setDrafts] = useState({});
  const [documentDrafts, setDocumentDrafts] = useState({});
  const [focusDocumentId, setFocusDocumentId] = useState(null);
  const [inspectingDocumentId, setInspectingDocumentId] = useState(null);
  const [documentOpenRequest, setDocumentOpenRequest] = useState(0);
  const instruction = drafts[project?.id || "new"] || "";
  const setInstruction = (value) =>
    setDrafts((current) => ({ ...current, [project?.id || "new"]: value }));
  const [note, setNote] = useState("");
  const [noteVersionId, setNoteVersionId] = useState(null);
  const [uploadPurpose, setUploadPurpose] = useState("take");
  const [models, setModels] = useState({});
  const [catalog, setCatalog] = useState([]);
  const method = project?.settings.methodDefaults?.crew || "auto";
  const llmModel = project?.settings.llmModel || models.reasoner || "";
  const imageModel =
    project?.settings.imageModel ||
    models.seedreamPro ||
    catalog.find((entry) => entry.kind === "image")?.id ||
    "";
  const videoModel =
    project?.settings.videoModel || models.seedance25 || models.seedance || "";
  const [revisionRoute, setRevisionRoute] = useState("frames");
  const importInput = useRef(null);
  const chatUploadInput = useRef(null);
  const uploadArea = useRef(null);
  const openUpload = (area = null) => {
    uploadArea.current = area;
    chatUploadInput.current.click();
  };
  const mediaInput = useRef(null);
  const pollCursor = useRef(0);
  const activateProject = useCallback(
    (result, firstScene = false) => {
      const next = result.project;
      const scene = firstScene
        ? next.nodes.find((node) => node.type === "scene")
        : null;
      setProject(next);
      setRevision(result.revision || 0);
      setSceneId(scene?.id || null);
      setContainerId(scene?.id || null);
      setPropertyTargetId(scene?.id || next.id);
      setItemId(null);
      setSelectedShotId(null);
      setReviewVersionId(null);
      setFocusDocumentId(null);
      setInspectingDocumentId(null);
      setNoteVersionId(null);
      setNote("");
      setUploadPurpose("take");
      // Initial loading must not override navigation already chosen in the shell.
      if (!firstScene) {
        setTab("Review");
        setModal(null);
      }
      if (!demo)
        setProjects((items) => [
          { id: next.id, title: next.title },
          ...items.filter((entry) => entry.id !== next.id),
        ]);
    },
    [demo],
  );

  useEffect(() => {
    if (demo) return undefined;
    let active = true;
    Promise.all([
      jsonFetch("/api/studio/projects"),
      jsonFetch("/api/film/config"),
    ])
      .then(([data, config]) => {
        if (!active) return;
        setProjects(data.items || []);
        setModels(config.models || {});
        setCatalog(config.catalog || []);
        if (data.items?.length)
          return jsonFetch(
            `/api/studio/projects?id=${encodeURIComponent(data.items[0].id)}`,
          ).then((loaded) => {
            if (active) {
              activateProject(loaded, true);
            }
          });
        return undefined;
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, [demo, activateProject]);

  useEffect(() => {
    if (demo || busy || modal || !project) return undefined;
    const batches = project.batches.filter(
      (batch) =>
        batch.approval &&
        ["approved", "running", "attention"].includes(batch.state),
    );
    if (!batches.length) return undefined;
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => {
      const batch = batches[pollCursor.current++ % batches.length];
      jsonFetch("/api/studio/batches", {
        ...post({
          action: "tick",
          id: project.id,
          revision,
          batchId: batch.id,
        }),
        signal: controller.signal,
      })
        .then((result) => {
          if (active) {
            setProject(result.project);
            setRevision(result.revision);
          }
        })
        .catch(async (error) => {
          if (active && error.status === 409) {
            const current = await jsonFetch(
              `/api/studio/projects?id=${encodeURIComponent(project.id)}`,
            ).catch(() => null);
            if (active && current) {
              setProject(current.project);
              setRevision(current.revision);
            }
          }
        });
    }, 12000);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [demo, busy, modal, project, revision]);

  const run = async (operation) => {
    setBusy(true);
    setMessage("");
    try {
      return await operation();
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
      if (error.status === 409 && project?.id && !demo) {
        const current = await jsonFetch(
          `/api/studio/projects?id=${encodeURIComponent(project.id)}`,
        ).catch(() => null);
        if (current) {
          setProject(current.project);
          setRevision(current.revision);
          setMessage(
            "Production refreshed after another edit or completed job. Your last action was not applied; review and save again.",
          );
        }
      }
      return null;
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (demo || busy || !project) return undefined;
    const tasks = (project.crewRuns || []).filter((task) =>
      ["queued", "running"].includes(task.state),
    );
    if (!tasks.length) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      const task = tasks[pollCursor.current++ % tasks.length];
      jsonFetch("/api/studio/crew", {
        ...post({ action: "advance", id: project.id, taskId: task.id }),
      })
        .then((result) => {
          if (active) {
            setProject(result.project);
            setRevision(result.revision);
          }
        })
        .catch(async (error) => {
          if (!active) return;
          // An interrupted HTTP response does not imply the model call stopped.
          // Reload the durable journal; the next tick observes its existing lease.
          const current = await jsonFetch(
            `/api/studio/projects?id=${encodeURIComponent(project.id)}`,
          ).catch(() => null);
          if (active && current) {
            setProject(current.project);
            setRevision(current.revision);
          }
          if (active) setMessage(error.message);
        });
    }, 2000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [demo, busy, project, revision]);
  const cancelChatTask = (taskId) =>
    run(async () => {
      const result = await jsonFetch(
        "/api/studio/crew",
        post({ action: "cancel", id: project.id, taskId }),
      );
      setProject(result.project);
      setRevision(result.revision);
    });
  const command = (type, payload) =>
    run(async () => {
      if (demo) {
        const next = applyCommand(project, { type, payload });
        setProject(next);
        return next;
      }
      const result = await jsonFetch(
        "/api/studio/projects",
        post({
          action: "command",
          id: project.id,
          revision,
          command: { type, payload },
        }),
      );
      setProject(result.project);
      setRevision(result.revision);
      return result.project;
    });
  const load = (id) =>
    run(async () => {
      const result = await jsonFetch(
        `/api/studio/projects?id=${encodeURIComponent(id)}`,
      );
      activateProject(result);
    });
  const newProject = (form) =>
    run(async () => {
      const created = createProject({
        title: form.title,
        scope: form.scope,
        brief: form.brief,
      });
      const result = demo
        ? { project: created, revision: 0 }
        : await jsonFetch(
            "/api/studio/projects",
            post({ action: "create", project: created }),
          );
      activateProject(result);
    });
  const selectItem = (item) => {
    setPropertyTargetId(item.id);
    setItemId(item.id);
    setReviewVersionId(null);
    setNoteVersionId(null);
    setNote("");
    if (item.sceneId) {
      setTab("Cut");
      setSceneId(item.sceneId);
      setContainerId(item.sceneId);
      setSelectedShotId(item.id);
    }
  };
  const download = (value, filename) => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const uploadDocuments = (files) =>
    run(async () => {
      if (!files.length) return;
      if (demo)
        throw new Error(
          "Open your studio to upload existing work and talk to the crew.",
        );
      let current = project
        ? { project, revision }
        : await jsonFetch(
            "/api/studio/projects",
            post({
              action: "create",
              project: createProject({
                title: files[0].name.replace(/\.[^.]+$/, ""),
              }),
            }),
          );
      const failures = [];
      let completed = 0;
      for (const file of files) {
        try {
          const uploaded = await uploadWork(file);
          const attach = () =>
            jsonFetch(
              "/api/studio/intake",
              post({
                id: current.project.id,
                revision: current.revision,
                ...uploaded,
                area: uploadArea.current,
              }),
            );
          try {
            current = await attach();
          } catch (error) {
            if (error.status !== 409) throw error;
            current = await jsonFetch(
              `/api/studio/projects?id=${encodeURIComponent(current.project.id)}`,
            );
            current = await attach();
          }
          setProject(current.project);
          setRevision(current.revision);
          completed += 1;
        } catch (error) {
          failures.push(`${file.name}: ${error.message}`);
        }
      }
      if (!project) activateProject(current);
      setMessage(
        `Processed ${completed} of ${files.length} files.${failures.length ? " Upload issues: " + failures.join("; ") : ""}`,
      );
    });
  const importProject = (file) =>
    run(async () => {
      if (!file) return;
      if (demo)
        throw new Error(
          "Open the authenticated studio to validate and import your project.",
        );
      if (!/\.json$/i.test(file.name)) {
        const content = await file.text();
        if (content.length > 500000)
          throw new Error(
            "This document exceeds the 500,000-character intake limit.",
          );
        let current = project
          ? { project, revision }
          : await jsonFetch(
              "/api/studio/projects",
              post({
                action: "create",
                project: createProject({
                  title: file.name.replace(/\.[^.]+$/, ""),
                  scope: "film",
                }),
              }),
            );
        current = await jsonFetch(
          "/api/studio/projects",
          post({
            action: "command",
            id: current.project.id,
            revision: current.revision,
            command: {
              type: "artifact.add",
              payload: { title: file.name, content },
            },
          }),
        );
        activateProject(current);
        setTab("Overview");
        setMessage(
          "Supplied document preserved in full. Use Validate supplied work for a completeness check, or direct the crew to work from it.",
        );
        return;
      }
      const input =
        file.size > 2 * 1024 * 1024
          ? { importKey: await uploadProjectFile(file) }
          : { project: JSON.parse(await file.text()) };
      const result = await jsonFetch(
        "/api/studio/projects",
        post({ action: "import", ...input }),
      );
      activateProject(result);
      setMessage(
        `Imported ${result.report?.approved || 0} complete versions. ${result.report?.gaps?.length || 0} gaps flagged for the crew.`,
      );
    });
  const crew = () =>
    run(async () => {
      if (demo)
        throw new Error(
          "This sample is for exploring the workspace. Sign in to chat.",
        );
      const result = await jsonFetch(
        "/api/studio/crew",
        post({
          id: project.id,
          revision,
          method,
          instruction,
          model: llmModel,
          sceneId,
          itemId,
          contextId: propertyTargetId,
          inspectingVersionId: ["Cut", "Review", "Assets", "Footage"].includes(
            tab,
          )
            ? version?.id || null
            : null,
          activeFileArea:
            Object.keys(FILE_AREAS).find((key) => FILE_AREAS[key] === tab) ||
            null,
          inspectingDocumentId:
            project.artifacts.find(
              (entry) =>
                entry.id === inspectingDocumentId &&
                FILE_AREAS[documentArea(project, entry)] === tab,
            )?.id || null,
          inspectingDocumentDraft: project.artifacts.some(
            (entry) =>
              entry.id === inspectingDocumentId &&
              FILE_AREAS[documentArea(project, entry)] === tab,
          )
            ? documentDrafts[inspectingDocumentId]
            : undefined,
        }),
      );
      setProject(result.project);
      setRevision(result.revision);
      setMessage(
        result.project.crewRuns?.some((task) => task.state === "queued")
          ? "Request saved. Work will continue here."
          : "Reply saved.",
      );
      setInstruction("");
    });
  const batchAction = (action, extra = {}) =>
    run(async () => {
      if (demo)
        throw new Error(
          "Sample workspace: no provider jobs or paid batches can run. Create a project in the authenticated studio.",
        );
      const result = await jsonFetch(
        "/api/studio/batches",
        post({
          action,
          id: project.id,
          revision,
          sceneId,
          model: videoModel,
          imageModel,
          llmModel,
          route: revisionRoute,
          ...extra,
        }),
      );
      setProject(result.project);
      setRevision(result.revision);
      setTab("Batches");
    });

  const deliveryAction = (action, extra = {}) =>
    run(async () => {
      if (demo)
        throw new Error("Sign in to assemble or export production media.");
      const result = await jsonFetch(
        "/api/studio/delivery",
        post({ action, id: project.id, ...extra }),
      );
      if (result.manifest) {
        download(result, `${project.title.replace(/\W+/g, "-")}.delivery.json`);
        return;
      }
      setProject(result.project);
      setRevision(result.revision);
      setTab("Overview");
    });
  const inspectContainer = (id) => {
    setPropertyTargetId(id || project.id);
    setSelectedShotId(null);
    setItemId(null);
    setReviewVersionId(null);
    if (project.nodes.find((node) => node.id === id)?.type === "scene") {
      setSceneId(id);
    } else setSceneId(null);
  };
  const navigate = (id) => {
    setContainerId(id);
    inspectContainer(id);
    setTab("Review");
  };
  const switchTab = (next) => {
    setTab(next);
  };
  const scene = project?.nodes.find((node) => node.id === sceneId);
  const inspectedNode = project?.nodes.find(
    (node) => node.id === propertyTargetId,
  );
  const rollupId = inspectedNode?.id || containerId || project?.id;
  const rollup = project?.nodes.find((node) => node.id === rollupId);
  const rollupContents = !project
    ? []
    : rollup?.type === "scene"
      ? sceneShots(project, rollup.id)
      : project.nodes
          .filter((node) => node.parentId === (rollup?.id || null))
          .sort((a, b) => a.order - b.order);
  const shots = project ? sceneShots(project, sceneId) : [];
  const item =
    project &&
    [...project.assets, ...project.shots].find(
      (candidate) => candidate.id === itemId,
    );
  const version =
    item?.versions.find((candidate) => candidate.id === reviewVersionId) ||
    selectedVersion(item) ||
    item?.versions.at(-1);
  const revisions = project ? revisionItems(project) : [];
  const displayNote =
    noteVersionId === version?.id ? note : version?.note || "";
  const requirement =
    project && sceneId ? lookdevRequirement(project, sceneId) : null;

  return (
    <div className="studio-shell">
      <Head>
        <title>{`${project ? `${project.title} — ` : ""}Film Agent Studio`}</title>
        <meta
          name="description"
          content="Your director’s workspace. One production, every possibility."
        />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <header className="studio-header">
        <a className="brand" href={demo ? "/demo" : "/"}>
          <span className="brand-mark">
            <Icon name="film" size={20} />
          </span>
          <strong>FILM AGENT</strong>
          <span className="brand-sub">STUDIO</span>
        </a>
        <div className="project-switch">
          <span className="muted">Workspace</span>
          <span>/</span>
          {project ? (
            <button onClick={() => setModal("projects")}>
              {project.title}
              <span className="tiny">⌄</span>
            </button>
          ) : (
            <span>New production</span>
          )}
        </div>
        <div className="header-right">
          {!demo && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const { error } = await getBrowserSupabase().auth.signOut();
                  if (error) throw error;
                  await router.replace("/login");
                })
              }
            >
              Sign out
            </button>
          )}
          <span className="save-state">
            <i />
            {busy
              ? "Working…"
              : demo
                ? "Sample workspace"
                : "Private workspace"}
          </span>
          <button className="avatar" title={userEmail || "Sample director"}>
            {userEmail ? userEmail[0].toUpperCase() : "D"}
          </button>
        </div>
      </header>
      {demo && (
        <div className="demo-bar">
          <span>EXAMPLE PROJECT</span> Explore the workflow with illustrated
          storyboard fixtures. No AI jobs will run.
          <Link href="/">
            Open your studio <Icon name="arrow" size={14} />
          </Link>
        </div>
      )}
      <div className="studio-body">
        <aside
          className={`project-nav ${navOpen ? "" : "nav-closed"}`}
          aria-label="Project navigation"
        >
          <button
            className="icon-button nav-toggle"
            aria-label={navOpen ? "Close left bar" : "Open left bar"}
            title={navOpen ? "Close left bar" : "Open left bar"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            <Icon name="chevron" />
          </button>
          <div className="nav-heading">
            PRODUCTION{" "}
            <button
              className="icon-button"
              title="New project"
              onClick={() => setModal("new")}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
          <button
            className={`nav-project ${tab === "Overview" ? "active" : ""}`}
            title={project?.title || "Project"}
            aria-label={project?.title || "Project"}
            onClick={() => navigate(null)}
          >
            <Icon name="film" />
            <span>
              {project?.title || "Your next picture"}
              <small>{project?.scope || "Production workspace"}</small>
            </span>
          </button>
          <div className="nav-divider" />
          {[
            "Overview",
            "Assets",
            "Footage",
            "Scripts",
            "Production docs",
            "Audio",
            "Batches",
            "History",
          ].map((entry) => (
            <button
              key={entry}
              className={`nav-item ${tab === entry ? "active" : ""}`}
              title={entry === "Overview" ? "Production overview" : entry}
              onClick={() => switchTab(entry)}
            >
              <Icon
                name={
                  {
                    Overview: "layers",
                    Assets: "grid",
                    Footage: "film",
                    Scripts: "document",
                    "Production docs": "document",
                    Audio: "audio",
                    Batches: "layers",
                    History: "clock",
                  }[entry]
                }
              />
              <span className="nav-label">
                {entry === "Overview" ? "Production overview" : entry}
              </span>
              <span className="nav-count">
                {entry === "Assets"
                  ? project?.assets.length || 0
                  : entry === "Batches"
                    ? project?.batches.length || 0
                    : ""}
              </span>
            </button>
          ))}
          <div className="nav-bottom">
            <button
              type="button"
              className="secondary full"
              title="Export project"
              aria-label="Export project"
              disabled={!project}
              onClick={() =>
                download(
                  project,
                  `${project.title.replace(/\W+/g, "-")}.studio.json`,
                )
              }
            >
              <Icon name="download" />
              <span className="nav-label">Export project</span>
            </button>
            <button
              className="secondary full"
              title="Production settings"
              aria-label="Production settings"
              onClick={() => setModal("settings")}
              disabled={!project}
            >
              <Icon name="settings" />{" "}
              <span className="nav-label">Production settings</span>
            </button>
          </div>
        </aside>
        <div className="project-workspace">
          {project && (
            <HierarchyStrip
              key={project.id}
              project={project}
              containerId={containerId}
              selectedId={inspectedNode?.id || selectedShotId}
              onNavigate={navigate}
              onAdd={(type) => {
                if (type === "shot") {
                  const target =
                    project.nodes.find(
                      (node) =>
                        node.id === containerId && node.type === "scene",
                    ) ||
                    project.nodes.find(
                      (node) => node.id === sceneId && node.type === "scene",
                    );
                  if (!project.nodes.some((node) => node.type === "scene")) {
                    setModal("scene");
                    return;
                  }
                  setSceneId(target?.id || null);
                  setModal("shot");
                } else {
                  setNewContainerType(type);
                  setModal("container");
                }
              }}
              onShot={(shot) => {
                selectItem(shot);
                setTab("Cut");
              }}
            />
          )}
          {message && (
            <div className="notice project-notice" role="status">
              <span>{message}</span>
              <button
                className="icon-button"
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          <div className="project-content">
            <main className="workspace">
              {!project ? (
                <div className="welcome">
                  <span className="eyebrow">A NEW WAY TO MAKE PICTURES</span>
                  <h1>
                    Your vision.
                    <br />A whole crew behind it.
                  </h1>
                  <p>
                    Start with an idea, or bring the work you already have.
                    <br />
                    Build and review your production in complete batches.
                  </p>
                  <div className="button-row">
                    <button className="primary" onClick={() => setModal("new")}>
                      <Icon name="plus" /> New production
                    </button>
                    <button
                      className="secondary"
                      onClick={() => importInput.current.click()}
                    >
                      Import project
                    </button>
                    <a className="text-button" href="/demo">
                      Explore a sample <Icon name="arrow" />
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  {!["Cut", "Review"].includes(tab) && (
                    <h1 className="view-title">
                      {tab === "Overview" ? "Production overview" : tab}
                    </h1>
                  )}
                  {tab === "Cut" && !scene && (
                    <section className="overview-card">
                      <h2>{inspectedNode?.title || project.title}</h2>
                      <p>
                        Edit this {inspectedNode?.type || project.scope}’s
                        direction and references below. Select its range label
                        in the strip to view its contents.
                      </p>
                    </section>
                  )}
                  {tab === "Cut" && scene && (
                    <>
                      <div className="viewer-top">
                        <span>
                          <b>
                            {item?.kind === "shot"
                              ? item.code || item.id
                              : "SCENE REVIEW"}
                          </b>
                          <span className="muted"> / </span>
                          {item?.title || scene.title}
                        </span>
                        {version && <Badge status={version.review} />}
                      </div>
                      <div className="media-viewer">
                        {version?.media?.url ? (
                          version.media.type === "video" ? (
                            <video
                              key={version.id}
                              src={version.media.url}
                              controls
                              playsInline
                            />
                          ) : (
                            <img
                              src={version.media.url}
                              alt={item?.title || "Production frame"}
                            />
                          )
                        ) : (
                          <div className="viewer-empty">
                            <Icon name="film" size={42} />
                            <h2>
                              {shots.length
                                ? "Select a shot to direct."
                                : "Give this scene its first frame."}
                            </h2>
                            <p>
                              Add your shots, bring in existing media, or
                              prepare a generation batch.
                            </p>
                            <button
                              className="secondary"
                              onClick={() => setModal("shot")}
                            >
                              <Icon name="plus" /> Add shot
                            </button>
                          </div>
                        )}
                        {version && (
                          <div className="viewer-caption">
                            <span>
                              {version.origin === "fixture"
                                ? "ILLUSTRATED STORYBOARD · SAMPLE"
                                : version.media?.type === "video"
                                  ? "DRAFT TAKE"
                                  : "PRODUCTION FRAME"}
                            </span>
                            <span>
                              V{version.number}{" "}
                              <span className="caption-divider">/</span>{" "}
                              {project.settings.aspectRatio}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="viewer-toolbar">
                        <div className="button-row">
                          <button
                            className="secondary compact"
                            disabled={!shots.length || busy}
                            onClick={() => {
                              setTab("Overview");
                              deliveryAction("review", { sceneId });
                            }}
                          >
                            Watch scene assembly
                          </button>
                          <button
                            className="secondary compact"
                            disabled={!shots.length || busy}
                            onClick={() =>
                              command("scene.approve", { sceneId })
                            }
                          >
                            <Icon name="check" size={15} />
                            {sceneIsApproved(project, sceneId)
                              ? "Scene approved"
                              : "Approve scene"}
                          </button>
                          <span className="muted">
                            {requirement?.required
                              ? `Lookdev · ${requirement.scope === "picture" ? "whole picture" : "scene review required"}`
                              : "Lookdev · below scene threshold"}
                          </span>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => setModal("shot")}
                        >
                          <Icon name="plus" size={15} /> Add shot
                        </button>
                      </div>
                    </>
                  )}
                  {tab === "Review" && (
                    <ReviewGrid
                      key={`rollup:${rollupId}`}
                      editable
                      actions={
                        <>
                          <button
                            className="text-button"
                            onClick={() => {
                              const type =
                                {
                                  scene: "shot",
                                  sequence: "scene",
                                  act: "sequence",
                                }[rollup?.type] || "act";
                              if (type === "shot") {
                                setSceneId(rollupId);
                                setModal("shot");
                              } else {
                                setContainerId(rollup?.id || null);
                                setNewContainerType(type);
                                setModal("container");
                              }
                            }}
                          >
                            Add{" "}
                            {{
                              scene: "shot",
                              sequence: "scene",
                              act: "sequence",
                            }[rollup?.type] || "act"}
                          </button>
                          {rollup && (
                            <button
                              className="text-button"
                              onClick={() => {
                                inspectContainer(rollupId);
                                setTab("Properties");
                              }}
                            >
                              Edit {rollup.type}
                            </button>
                          )}
                        </>
                      }
                      items={rollupContents}
                      {...{ project, busy, command }}
                      selectItem={(entry) => {
                        if (entry.kind) selectItem(entry);
                        else navigate(entry.id);
                      }}
                    />
                  )}
                  {Object.values(FILE_AREAS).includes(tab) && (
                    <ProjectFiles
                      key={`${project.id}:${documentOpenRequest}`}
                      {...{
                        focusDocumentId,
                        documentDrafts,
                        setDocumentDrafts,
                      }}
                      project={project}
                      area={Object.keys(FILE_AREAS).find(
                        (key) => FILE_AREAS[key] === tab,
                      )}
                      busy={busy}
                      command={command}
                      onUpload={openUpload}
                      onInspectDocument={setInspectingDocumentId}
                    />
                  )}
                  {tab === "Footage" && (
                    <ReviewGrid
                      items={project.shots}
                      {...{ busy, command, selectItem }}
                    />
                  )}
                  {tab === "Assets" && (
                    <div className="asset-section">
                      <div className="section-actions">
                        <span>
                          {project.assets.length} assets · review the full batch
                          together
                        </span>
                        <button
                          className="secondary"
                          onClick={() => setModal("asset")}
                        >
                          <Icon name="plus" /> Add asset
                        </button>
                      </div>
                      <ReviewGrid
                        items={project.assets}
                        {...{ busy, command, selectItem }}
                      />
                    </div>
                  )}
                  {tab === "Batches" && (
                    <BatchPanel
                      {...{
                        project,
                        revisions,
                        revisionRoute,
                        setRevisionRoute,
                        busy,
                        command,
                        batchAction,
                        catalog,
                      }}
                    />
                  )}
                  {tab === "History" && (
                    <div className="history-list">
                      {[...project.events].reverse().map((event) => (
                        <article key={event.id}>
                          <div className="history-marker">
                            <Icon name="clock" size={16} />
                          </div>
                          <div>
                            <h3>{event.kind.replaceAll(".", " · ")}</h3>
                            <p>
                              {event.itemId ||
                                event.sceneId ||
                                event.batchId ||
                                event.note ||
                                "Production record"}
                              {event.versionId ? ` / ${event.versionId}` : ""}
                            </p>
                            <small>
                              {event.actor} ·{" "}
                              {new Date(event.at).toLocaleString()}
                            </small>
                            {event.review && <Badge status={event.review} />}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {tab === "Overview" && (
                    <div className="overview">
                      <div className="overview-stats">
                        {[
                          [
                            "Scenes",
                            project.nodes.filter(
                              (node) => node.type === "scene",
                            ).length,
                          ],
                          ["Shots", project.shots.length],
                          ["Assets", project.assets.length],
                          ["Revisions", revisions.length],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                      <section className="overview-card">
                        <span className="eyebrow">GLOBAL STYLE</span>
                        <p>
                          {project.globalStyle ||
                            "Define the visual language that carries through the production."}
                        </p>
                        <button
                          className="text-button"
                          onClick={() => setModal("settings")}
                        >
                          Edit production direction{" "}
                          <Icon name="arrow" size={15} />
                        </button>
                      </section>
                      <section className="overview-card">
                        <span className="eyebrow">
                          CREW NOTES & DEVELOPMENT
                        </span>
                        {project.artifacts.length ? (
                          project.artifacts.map((artifact) => (
                            <details key={artifact.id}>
                              <summary>
                                {artifact.title || methodLabel(artifact.method)}
                              </summary>
                              <pre>{artifact.content}</pre>
                              <label className="field">
                                Document approval
                                <select
                                  value={artifact.review || "pending"}
                                  disabled={busy}
                                  onChange={(event) =>
                                    command("artifact.review", {
                                      id: artifact.id,
                                      review: event.target.value,
                                    })
                                  }
                                >
                                  {Object.entries(REVIEW_LABELS).map(
                                    ([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>
                              {artifact.validation?.gaps?.length > 0 && (
                                <p className="gate-message">
                                  {artifact.validation.gaps.join(" ")}
                                </p>
                              )}
                              {artifact.prompt && (
                                <details>
                                  <summary>
                                    Method & exact preparation recipe
                                  </summary>
                                  <p>
                                    {methodLabel(artifact.method)} ·{" "}
                                    {artifact.model} · {artifact.methodVersion}
                                  </p>
                                  <pre>{artifact.prompt}</pre>
                                </details>
                              )}
                              {artifact.decisions?.length > 0 && (
                                <p className="gate-message">
                                  Working decisions:{" "}
                                  {artifact.decisions.join(" • ")}
                                </p>
                              )}
                              {artifact.proposal && !artifact.appliedAt && (
                                <button
                                  className="secondary"
                                  disabled={busy}
                                  onClick={() =>
                                    command("artifact.apply", {
                                      id: artifact.id,
                                    })
                                  }
                                >
                                  Apply proposed production changes
                                </button>
                              )}
                            </details>
                          ))
                        ) : (
                          <p>
                            Your writing, direction, analysis, and shot-planning
                            outputs will live here, with their methods and
                            prompts.
                          </p>
                        )}
                      </section>
                      <div className="button-row">
                        <button
                          className="secondary"
                          onClick={() => importInput.current.click()}
                        >
                          Import completed work
                        </button>
                        <button
                          className="secondary"
                          onClick={() => deliveryAction("review", { sceneId })}
                        >
                          <Icon name="download" /> Render scene assembly
                        </button>
                      </div>
                      <GuidesPanel {...{ project, busy, command }} />
                      <DeliveryPanel
                        {...{ project, sceneId, busy, command }}
                        action={deliveryAction}
                      />
                    </div>
                  )}
                </>
              )}
              <section
                className="manual-inspector"
                hidden={
                  !(
                    tab === "Properties" ||
                    (item && ["Cut", "Assets", "Footage"].includes(tab))
                  )
                }
                aria-label="Manual object controls"
              >
                <div className="inspector-object">
                  {item ? (
                    <>
                      <div className="inspector-title">
                        <span className="eyebrow">
                          {item.kind === "asset" ? item.type : "SHOT DETAILS"}
                        </span>
                        <h2>{item.title}</h2>
                      </div>
                      <label className="field">
                        Reviewing version
                        <select
                          value={version?.id || ""}
                          onChange={(event) => {
                            setReviewVersionId(event.target.value);
                            setNoteVersionId(null);
                            setNote(
                              item.versions.find(
                                (candidate) =>
                                  candidate.id === event.target.value,
                              )?.note || "",
                            );
                          }}
                        >
                          {!item.versions.length && (
                            <option value="">No versions yet</option>
                          )}
                          {item.versions.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              V{entry.number} · {REVIEW_LABELS[entry.review]}
                              {entry.id === item.selectedVersionId
                                ? " · selected"
                                : ""}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        Approval status
                        <select
                          aria-label="Approval status"
                          className={`review-select ${version?.review || ""}`}
                          disabled={!version || busy}
                          value={version?.review || "pending"}
                          onChange={(event) =>
                            command("version.review", {
                              itemId: item.id,
                              versionId: version.id,
                              review: event.target.value,
                              note: displayNote,
                            })
                          }
                        >
                          {Object.entries(REVIEW_LABELS).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <div className="selected-version-note">
                        {item.versions
                          .filter((entry) => entry.review === "approved")
                          .map((entry) => `V${entry.number}`)
                          .join(", ") || "No version"}{" "}
                        approved ·{" "}
                        {selectedVersion(item)
                          ? `V${selectedVersion(item).number} selected`
                          : "nothing selected"}
                      </div>
                      {version && version.id !== item.selectedVersionId && (
                        <button
                          className="secondary full"
                          disabled={busy}
                          onClick={() =>
                            command("version.select", {
                              itemId: item.id,
                              versionId: version.id,
                            })
                          }
                        >
                          Select V{version.number} for this item
                        </button>
                      )}
                      <div className="inspector-rule" />
                      <span className="eyebrow">GENERATION RECIPE</span>
                      <PromptField
                        label="Exact prompt"
                        readOnly
                        rows={7}
                        value={
                          version ? (version.prompt ?? "") : (item.prompt ?? "")
                        }
                        placeholder="Original prompt is unknown for this imported version."
                      />
                      <dl className="recipe-meta">
                        <dt>Method</dt>
                        <dd>{methodLabel(version?.method)}</dd>
                        <dt>Model</dt>
                        <dd>{version?.model || "Not recorded"}</dd>
                        <dt>Seed</dt>
                        <dd>{version?.seed ?? "Not recorded"}</dd>
                        <dt>
                          {item.kind === "shot" ? "Shot runtime" : "Format"}
                        </dt>
                        <dd>
                          {item.kind === "shot"
                            ? `${item.duration}s`
                            : "Still image"}
                        </dd>
                      </dl>
                      <GenerationDetails
                        inline
                        key={version?.id || item.id}
                        {...{ project, item, version }}
                      />
                      <label className="field">
                        Revision notes
                        <textarea
                          rows={3}
                          placeholder="What should change in the next batch?"
                          value={displayNote}
                          onChange={(event) => {
                            setNote(event.target.value);
                            setNoteVersionId(version?.id || null);
                          }}
                        />
                      </label>
                      {item.kind === "shot" && version && (
                        <label className="field">
                          Repair method for this version
                          <select
                            disabled={busy}
                            value={version.repairRoute || ""}
                            onChange={(event) =>
                              command("version.review", {
                                itemId: item.id,
                                versionId: version.id,
                                review: version.review,
                                note: displayNote,
                                repairRoute: event.target.value,
                              })
                            }
                          >
                            <option value="">Use batch method</option>
                            <option value="frames">
                              Extract & revise frames
                            </option>
                            <option value="video-edit">
                              Targeted video edit
                            </option>
                            <option value="rerun">Full clip rerun</option>
                          </select>
                        </label>
                      )}
                      <button
                        className="secondary full"
                        disabled={!version || busy}
                        onClick={() =>
                          command("version.review", {
                            itemId: item.id,
                            versionId: version.id,
                            review: "revision",
                            note: displayNote,
                          })
                        }
                      >
                        Add to revision batch
                      </button>
                      <div className="inspector-rule" />

                      <button
                        className="secondary full"
                        disabled={busy}
                        onClick={() => mediaInput.current.click()}
                      >
                        <Icon name="plus" />{" "}
                        {uploadPurpose === "take" || item.kind === "asset"
                          ? "Import a new version"
                          : "Import guide media"}
                      </button>
                      {item.kind === "shot" && (
                        <label className="field">
                          Import media as
                          <select
                            value={uploadPurpose}
                            onChange={(event) =>
                              setUploadPurpose(event.target.value)
                            }
                          >
                            <option value="take">Shot version</option>
                            <option value="board">
                              Storyboard / production frame
                            </option>
                            <option value="previs">
                              Previs video reference
                            </option>
                          </select>
                        </label>
                      )}
                      {item.kind === "shot" && (
                        <button
                          className="text-button full"
                          onClick={() => setModal("edit-shot")}
                        >
                          Edit shot intent
                        </button>
                      )}
                      {item.kind === "asset" && (
                        <button
                          className="text-button full"
                          onClick={() => setModal("edit-asset")}
                        >
                          Edit asset intent
                        </button>
                      )}
                    </>
                  ) : null}
                  {project && (
                    <ObjectProperties
                      key={`${project.id}:${propertyTargetId || project.id}`}
                      project={project}
                      targetId={propertyTargetId}
                      busy={busy}
                      command={command}
                    />
                  )}
                </div>
              </section>
            </main>
          </div>
        </div>
        <aside
          className={`crew-sidebar ${chatOpen ? "" : "chat-collapsed"}`}
          aria-label="Chat sidebar"
        >
          {!chatOpen && (
            <button
              className="icon-button expand-chat"
              aria-label="Expand chat"
              title="Expand chat"
              onClick={() => setChatOpen(true)}
            >
              <Icon name="spark" />
            </button>
          )}
          <section className="crew-dock" aria-label="Project chat">
            <div className="crew-dock-heading">
              <h2>Chat</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Collapse chat"
                title="Collapse chat"
                aria-expanded={true}
                onClick={() => setChatOpen(false)}
              >
                <Icon name="chevron" />
              </button>
            </div>
            {project && (
              <CrewConversation
                {...{ project, busy, command }}
                cancelTask={cancelChatTask}
                openDocument={(document) => {
                  setFocusDocumentId(document.id);
                  setInspectingDocumentId(document.id);
                  setDocumentOpenRequest((value) => value + 1);
                  setTab(FILE_AREAS[document.documentArea]);
                }}
                prepare={(kind) => batchAction("prepare", { kind })}
              />
            )}
            <PromptField
              label="Message"
              rows={3}
              placeholder="What would you like to do?"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
            <div className="crew-compose-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                aria-label="Upload files"
                title="Upload files"
                onClick={() => openUpload()}
              >
                <Icon name="upload" />
              </button>
              <button
                className="primary full"
                disabled={busy || !project || !instruction.trim()}
                onClick={crew}
              >
                <Icon name="spark" /> {busy ? "Working…" : "Send"}
              </button>
            </div>
            <small className="crew-send-note">
              {demo
                ? "Illustrated demo · sign in to chat."
                : "Replies use the project's reasoning model. Paid generation batches still need your approval."}
            </small>
            {project && <PhaseChecklist project={project} onOpen={switchTab} />}
          </section>
        </aside>
      </div>
      <footer className="studio-footer">
        <span>
          <i />
          {demo
            ? "Sample · changes are temporary"
            : "Private production workspace"}
        </span>
        <span>
          {project
            ? `${project.shots.length} shots · ${project.segments.length} segments`
            : "Film Agent Studio"}
          <span className="footer-divider">/</span>DIRECTOR + CREW
        </span>
      </footer>
      <input
        ref={chatUploadInput}
        hidden
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        onChange={(event) => {
          uploadDocuments(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />
      <input
        ref={importInput}
        hidden
        type="file"
        accept="application/json,.json,text/plain,.txt,.md,.fountain"
        onChange={(event) => {
          importProject(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={mediaInput}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file || !item) return;
          run(async () => {
            if (demo)
              throw new Error("Sign in to upload media to your production.");
            const { uploadMedia } =
              await import("../../../utils/film/uploadMedia");
            const result = await uploadMedia(file);
            if (uploadPurpose !== "take" && item.kind === "shot")
              return command("guide.add", {
                targetId: item.id,
                kind: uploadPurpose,
                media: {
                  url: result.url,
                  type: file.type.startsWith("video") ? "video" : "image",
                },
              });
            return command("version.add", {
              itemId: item.id,
              media: {
                url: result.url,
                type: file.type.startsWith("video") ? "video" : "image",
              },
            });
          });
        }}
      />
      {modal && (
        <FormModal
          kind={modal}
          project={project}
          item={item}
          projects={projects}
          container={project?.nodes.find((node) => node.id === containerId)}
          containerType={newContainerType}
          defaultSceneId={sceneId}
          busy={busy}
          catalog={catalog}
          defaults={{ method, imageModel, videoModel, llmModel }}
          onClose={closeModal}
          onLoad={(id) => {
            load(id);
            setModal(null);
          }}
          onSubmit={async (form) => {
            if (modal === "new") return newProject(form);
            let saved;
            if (modal === "container")
              saved = await command("node.add", {
                type: newContainerType,
                parentId: containerId,
                title: form.title,
                location: form.location,
                time: form.time,
              });
            if (modal === "container-edit")
              saved = await command("node.update", {
                id: containerId,
                title: form.title,
                location: form.location,
                time: form.time,
                order: Number(form.order),
              });
            if (modal === "settings")
              saved = await command("project.update", {
                title: form.title,
                brief: form.brief,
                globalStyle: form.style,
                settings: {
                  llmModel: form.llmModel,
                  imageModel: form.imageModel,
                  videoModel: form.videoModel,
                  methodDefaults: {
                    ...project.settings.methodDefaults,
                    crew: form.method,
                  },
                  lookdevMode: form.lookdev,
                  aspectRatio: form.ratio,
                  draftResolution: form.draftResolution,
                  deliveryResolution: form.deliveryResolution,
                  seed: form.seed === "" ? null : Number(form.seed),
                  audio: form.audio === "on",
                },
              });
            if (modal === "scene")
              saved = await command("node.add", {
                type: "scene",
                parentId: form.sequence,
                title: form.title,
                location: form.location,
                time: form.time,
              });
            if (["shot", "asset"].includes(modal))
              saved = await command("item.add", {
                kind: modal,
                title: form.title,
                prompt: form.prompt,
                duration: Number(form.duration),
                sceneId: modal === "shot" ? form.sceneId : undefined,
                assetType: form.assetType,
              });
            if (modal === "edit-shot")
              saved = await command("item.update", {
                id: item.id,
                title: form.title,
                prompt: form.prompt,
                duration: Number(form.duration),
                beats: form.beats?.trim()
                  ? form.beats
                      .trim()
                      .split("\n")
                      .map((line) => {
                        const split = line.indexOf("|");
                        return {
                          duration: Number(line.slice(0, split).trim()),
                          text: line.slice(split + 1).trim(),
                        };
                      })
                  : [],
                assetIds: form.assetIds
                  ? form.assetIds.split(",").filter(Boolean)
                  : [],
              });
            if (modal === "edit-asset")
              saved = await command("item.update", {
                id: item.id,
                title: form.title,
                prompt: form.prompt,
                type: form.assetType,
              });
            if (saved) {
              setModal(null);
              if (modal === "shot") {
                const added = saved.shots.find(
                  (shot) =>
                    !project.shots.some((existing) => existing.id === shot.id),
                );
                if (added) selectItem(added);
              }
            }
            return null;
          }}
        />
      )}
    </div>
  );
}

function FormModal({
  kind,
  project,
  item,
  projects,
  busy,
  onClose,
  onSubmit,
  onLoad,
  container,
  containerType,
  defaultSceneId,
  catalog = [],
  defaults = {},
}) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const keyboard = (event) => {
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const controls = [
        ...dialog.current.querySelectorAll(
          'button:not(:disabled),input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]',
        ),
      ];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.current?.querySelector("input,button")?.focus();
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      previous?.focus?.();
    };
  }, [onClose]);
  const title = {
    new: "Start a production",
    settings: "Production settings",
    scene: "Add a scene",
    shot: "Add a shot",
    asset: "Add an asset",
    "edit-shot": "Edit shot intent",
    "edit-asset": "Edit asset intent",
    projects: "Your productions",
    container: `Add ${containerType}`,
    "container-edit": `Edit ${container?.type || "container"}`,
  }[kind];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={dialog}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        {kind === "projects" ? (
          <div className="project-list">
            {projects.length ? (
              projects.map((entry) => (
                <button
                  className="secondary full"
                  key={entry.id}
                  onClick={() => onLoad(entry.id)}
                >
                  {entry.title}
                </button>
              ))
            ) : (
              <p>This sample is not saved to your account.</p>
            )}
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              if (kind === "edit-shot")
                data.set("assetIds", data.getAll("assetSelection").join(","));
              onSubmit(Object.fromEntries(data));
            }}
          >
            <label className="field">
              Title
              <input
                autoFocus
                name="title"
                required
                defaultValue={
                  kind === "settings"
                    ? project.title
                    : kind === "container-edit"
                      ? container.title
                      : ["edit-shot", "edit-asset"].includes(kind)
                        ? item.title
                        : ""
                }
                placeholder={kind === "new" ? "Your next picture" : title}
              />
            </label>
            {kind === "new" && (
              <label className="field">
                Deliverable scope
                <select name="scope">
                  <option value="film">Film</option>
                  <option value="episode">Episode</option>
                  <option value="scene">Scene</option>
                </select>
              </label>
            )}
            {["new", "settings"].includes(kind) && (
              <label className="field">
                Brief
                <textarea
                  name="brief"
                  rows={3}
                  defaultValue={project?.brief || ""}
                  placeholder="What are we making? What do you already have?"
                />
              </label>
            )}
            {kind === "settings" && (
              <>
                <PromptField
                  label="Global style"
                  name="style"
                  rows={5}
                  defaultValue={project.globalStyle}
                />
                <details>
                  <summary>Advanced method override</summary>
                  <label className="field">
                    Crew methodology
                    <select
                      name="method"
                      defaultValue={
                        project.settings.methodDefaults?.crew || defaults.method
                      }
                    >
                      {METHODS.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </details>
                {[
                  ["llmModel", "Reasoning model", "llm"],
                  ["imageModel", "Image model", "image"],
                  ["videoModel", "Video model", "video"],
                ].map(([key, label, kind]) => (
                  <label className="field" key={key}>
                    {label}
                    <select
                      name={key}
                      defaultValue={
                        project.settings[key] || defaults[key] || ""
                      }
                    >
                      <option value="">Use configured default</option>
                      {catalog
                        .filter((entry) => entry.kind === kind)
                        .map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.label}
                          </option>
                        ))}
                    </select>
                  </label>
                ))}
                <label className="field">
                  Lookdev coverage
                  <select
                    name="lookdev"
                    defaultValue={project.settings.lookdevMode}
                  >
                    <option value="scene">
                      Default · scenes with more than 3 segments
                    </option>
                    <option value="picture">
                      Reduced · one for the whole picture
                    </option>
                  </select>
                </label>
                <label className="field">
                  Aspect ratio
                  <select
                    name="ratio"
                    defaultValue={project.settings.aspectRatio}
                  >
                    <option>16:9</option>
                    <option>2.39:1</option>
                    <option>9:16</option>
                    <option>1:1</option>
                  </select>
                </label>
                <label className="field">
                  Draft resolution
                  <select
                    name="draftResolution"
                    defaultValue={project.settings.draftResolution}
                  >
                    {["480p", "720p", "768p", "1080p", "2K", "4K"].map(
                      (entry) => (
                        <option key={entry}>{entry}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className="field">
                  Delivery resolution
                  <select
                    name="deliveryResolution"
                    defaultValue={project.settings.deliveryResolution}
                  >
                    {["1080p", "2K", "4K"].map((entry) => (
                      <option key={entry}>{entry}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Fixed seed (optional)
                  <input
                    name="seed"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={project.settings.seed ?? ""}
                    placeholder="Fresh seed for each request"
                  />
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    name="audio"
                    defaultChecked={project.settings.audio !== false}
                  />{" "}
                  Generate native sound when supported
                </label>
                <p className="modal-hint">
                  Unsupported draft sizes use the model’s lowest supported
                  resolution and are shown in the batch plan. Changing the
                  shared setup can invalidate prior lookdev. Historical versions
                  keep their original prompts.
                </p>
              </>
            )}
            {kind === "scene" && (
              <>
                <label className="field">
                  Sequence
                  <select name="sequence">
                    {project.nodes
                      .filter((node) => node.type === "sequence")
                      .map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.title}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="field">
                  Location
                  <input name="location" placeholder="INT. CONTROL ROOM" />
                </label>
                <label className="field">
                  Time
                  <input name="time" placeholder="NIGHT" />
                </label>
              </>
            )}
            {((kind === "container" && containerType === "scene") ||
              (kind === "container-edit" && container?.type === "scene")) && (
              <>
                <label className="field">
                  Location
                  <input
                    name="location"
                    defaultValue={container?.location || ""}
                  />
                </label>
                <label className="field">
                  Time
                  <input name="time" defaultValue={container?.time || ""} />
                </label>
              </>
            )}
            {kind === "container-edit" && (
              <label className="field">
                Position among siblings
                <input
                  name="order"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={container.order}
                />
              </label>
            )}
            {["shot", "asset", "edit-shot", "edit-asset"].includes(kind) && (
              <>
                {kind === "shot" && (
                  <label className="field">
                    Scene
                    <select
                      name="sceneId"
                      aria-label="Scene"
                      defaultValue={defaultSceneId || ""}
                      required
                    >
                      <option value="" disabled>
                        Choose a scene
                      </option>
                      {project.nodes
                        .filter((node) => node.type === "scene")
                        .map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.code || node.id} · {node.title}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                <PromptField
                  label={
                    ["asset", "edit-asset"].includes(kind)
                      ? "Design description"
                      : "Shot intent / prompt"
                  }
                  name="prompt"
                  rows={5}
                  defaultValue={
                    ["edit-shot", "edit-asset"].includes(kind)
                      ? item.prompt || item.description || ""
                      : ""
                  }
                  required
                />
                {["asset", "edit-asset"].includes(kind) ? (
                  <label className="field">
                    Asset type
                    <select
                      name="assetType"
                      defaultValue={item?.type || "character"}
                    >
                      <option value="character">Character</option>
                      <option value="location">Location</option>
                      <option value="prop">Prop</option>
                      <option value="creature">Creature</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="wardrobe">Wardrobe</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                ) : (
                  <label className="field">
                    Used duration (seconds)
                    <input
                      name="duration"
                      type="number"
                      min="0.1"
                      step="0.1"
                      defaultValue={kind === "edit-shot" ? item.duration : 5}
                      required
                    />
                  </label>
                )}
                {kind === "edit-shot" && (
                  <>
                    <label className="field">
                      Timed continuation beats
                      <textarea
                        name="beats"
                        rows={5}
                        defaultValue={(item.beats || [])
                          .map((beat) => `${beat.duration} | ${beat.text}`)
                          .join("\n")}
                        placeholder="14 | Complete sentence or action.&#10;6 | Next complete action."
                      />
                    </label>
                    <p className="modal-hint">
                      One duration | action per line. Beats must add up to the
                      shot duration. A beat stays intact when the model needs
                      multiple segments.
                    </p>
                    <label className="field">
                      Asset references
                      <select
                        multiple
                        name="assetSelection"
                        defaultValue={item.assetIds || []}
                      >
                        {project.assets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.title}
                          </option>
                        ))}
                      </select>
                      <input
                        type="hidden"
                        name="assetIds"
                        value={(item.assetIds || []).join(",")}
                      />
                    </label>
                  </>
                )}
              </>
            )}
            <footer>
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button disabled={busy} type="submit" className="primary">
                {kind === "new" ? "Create production" : "Save changes"}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
