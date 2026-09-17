import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function InspectDialog({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="inspect-dialog"
      aria-label={title}
      onClose={onClose}
    >
      <header>
        <h2>{title}</h2>
        <button type="button" className="secondary" onClick={onClose}>
          Close
        </button>
      </header>
      {children}
    </dialog>,
    document.body,
  );
}

export default function PromptField({
  label,
  value,
  defaultValue = "",
  onChange,
  ...props
}) {
  const id = useId();
  const [draft, setDraft] = useState(defaultValue);
  const [expanded, setExpanded] = useState(false);
  const text = value ?? draft;
  const change = (event) => {
    setDraft(event.target.value);
    onChange?.(event);
  };
  return (
    <div className="field prompt-field">
      <div className="prompt-field-heading">
        <label htmlFor={id}>{label}</label>
        <button
          type="button"
          className="text-button"
          aria-label={`Expand ${label}`}
          onClick={() => setExpanded(true)}
        >
          Expand
        </button>
      </div>
      <textarea {...props} id={id} value={text} onChange={change} />
      <small>
        {text.length.toLocaleString()} characters
        {props.readOnly ? " · read only" : ""}
      </small>
      {expanded && (
        <InspectDialog title={label} onClose={() => setExpanded(false)}>
          <p>
            {text.length.toLocaleString()} characters ·{" "}
            {props.readOnly
              ? "Read-only prompt. Select and copy any part of the text."
              : "Changes stay in the form. Save the form to apply them."}
          </p>
          <textarea
            className="expanded-prompt"
            aria-label={`${label} expanded`}
            value={text}
            onChange={change}
            readOnly={props.readOnly}
            maxLength={props.maxLength}
          />
        </InspectDialog>
      )}
    </div>
  );
}
