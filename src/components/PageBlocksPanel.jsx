import { useEffect, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function SortableRow({ block, isFirst, isLast, onToggleVisible, onMove, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.block_key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-neutral-400 hover:text-neutral-600 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMove(block.block_key, -1)}
          disabled={isFirst}
          className="text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
          aria-label="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(block.block_key, 1)}
          disabled={isLast}
          className="text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
          aria-label="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSelect(block.block_key)}
        className={`flex-1 text-left text-sm font-semibold hover:underline ${
          block.is_visible ? "text-neutral-800" : "text-neutral-400"
        }`}
        title="Click to edit this section's content"
      >
        {block.label}
      </button>

      <button
        type="button"
        onClick={() => onToggleVisible(block.block_key)}
        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
        title={block.is_visible ? "Hide from public site" : "Show on public site"}
      >
        {block.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function PageBlocksPanel({ pageKey, onSelectBlock }) {
  const { apiFetch } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    apiFetch(`/page-blocks/${pageKey}`)
      .then((data) => setBlocks(data.blocks))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  const markChanged = () => {
    setDirty(true);
    setSaved(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks((items) => {
      const oldIndex = items.findIndex((i) => i.block_key === active.id);
      const newIndex = items.findIndex((i) => i.block_key === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
    markChanged();
  };

  const moveBlock = (blockKey, direction) => {
    setBlocks((items) => {
      const index = items.findIndex((i) => i.block_key === blockKey);
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return items;
      return arrayMove(items, index, newIndex);
    });
    markChanged();
  };

  const toggleVisible = (blockKey) => {
    setBlocks((items) =>
      items.map((b) => (b.block_key === blockKey ? { ...b, is_visible: !b.is_visible } : b)),
    );
    markChanged();
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/page-blocks/${pageKey}`, {
        method: "PUT",
        body: JSON.stringify({
          blocks: blocks.map((b, i) => ({ block_key: b.block_key, display_order: i, is_visible: b.is_visible })),
        }),
      });
      setDirty(false);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading layout...</p>;
  if (blocks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Section Order & Visibility</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Drag, or use the arrows, to reorder. Click a name to edit its content. Click the eye to show/hide.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs font-semibold text-green-600">Saved ✓</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.block_key)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, i) => (
              <SortableRow
                key={block.block_key}
                block={block}
                isFirst={i === 0}
                isLast={i === blocks.length - 1}
                onToggleVisible={toggleVisible}
                onMove={moveBlock}
                onSelect={onSelectBlock}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}