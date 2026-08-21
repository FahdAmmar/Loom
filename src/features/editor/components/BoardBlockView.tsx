import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Smile, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BoardColumn } from "@/types/entities";

interface BoardBlockViewProps {
  columns: BoardColumn[];
  onChange: (content: { columns: BoardColumn[] }) => void;
}

const COLUMN_COLOR_CLASSES: Record<BoardColumn["color"], string> = {
  gold: "bg-brand-gold/15 text-brand-gold",
  violet: "bg-brand-violet/15 text-brand-violet",
  mint: "bg-brand-mint/15 text-brand-mint",
};
const COLUMN_COLORS: BoardColumn["color"][] = ["gold", "violet", "mint"];
const CARD_ICONS = ["🚀", "🐛", "💡", "📌", "⚠️", "🔥", "📝", "🎯", "💬", "✅"];

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function findColumnIndex(columns: BoardColumn[], cardId: string): number {
  return columns.findIndex((col) => col.cards.some((c) => c.id === cardId));
}

export function BoardBlockView({ columns, onChange }: BoardBlockViewProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  // Pointer: 8px of movement before a drag starts, so clicking into a title
  // input to edit it doesn't get mistaken for the start of a drag gesture.
  // Keyboard: Tab to a grip handle, Space/Enter to pick up, arrow keys to
  // move (works across both the horizontal column strategy and each
  // column's vertical card strategy — sortableKeyboardCoordinates reads
  // whichever SortableContext the focused item belongs to).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function updateColumns(next: BoardColumn[]) {
    onChange({ columns: next });
  }

  function addColumn() {
    const usedColors = columns.map((c) => c.color);
    const color =
      COLUMN_COLORS.find((c) => !usedColors.includes(c)) ??
      COLUMN_COLORS[columns.length % COLUMN_COLORS.length];
    updateColumns([...columns, { id: newId("col"), title: "New column", color, cards: [] }]);
  }

  function renameColumn(columnId: string, title: string) {
    updateColumns(columns.map((col) => (col.id === columnId ? { ...col, title } : col)));
  }

  function deleteColumn(columnId: string) {
    updateColumns(columns.filter((col) => col.id !== columnId));
  }

  function addCard(columnId: string) {
    updateColumns(
      columns.map((col) =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, { id: newId("card"), title: "" }] }
          : col,
      ),
    );
  }

  function renameCard(cardId: string, title: string) {
    updateColumns(
      columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === cardId ? { ...c, title } : c)),
      })),
    );
  }

  function setCardIcon(cardId: string, icon: string) {
    updateColumns(
      columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === cardId ? { ...c, icon } : c)),
      })),
    );
  }

  function deleteCard(cardId: string) {
    updateColumns(
      columns.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) })),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCardId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type as "column" | "card" | undefined;
    if (activeType === "column") {
      const from = columns.findIndex((c) => c.id === active.id);
      const to = columns.findIndex((c) => c.id === over.id);
      if (from !== -1 && to !== -1) updateColumns(arrayMove(columns, from, to));
      return;
    }

    // Dragging a card: `over` is either another card, or a column's empty
    // drop zone (droppable id `col-drop-<columnId>`) when the column has no
    // cards to land on top of.
    const fromColIndex = findColumnIndex(columns, String(active.id));
    if (fromColIndex === -1) return;

    const overId = String(over.id);
    const overIsEmptyZone = overId.startsWith("col-drop-");
    const toColIndex = overIsEmptyZone
      ? columns.findIndex((c) => c.id === overId.replace("col-drop-", ""))
      : findColumnIndex(columns, overId);
    if (toColIndex === -1) return;

    const fromCol = columns[fromColIndex];
    const card = fromCol.cards.find((c) => c.id === active.id);
    if (!card) return;

    if (fromColIndex === toColIndex && !overIsEmptyZone) {
      const oldIndex = fromCol.cards.findIndex((c) => c.id === active.id);
      const newIndex = fromCol.cards.findIndex((c) => c.id === overId);
      const next = columns.map((col, i) =>
        i === fromColIndex ? { ...col, cards: arrayMove(col.cards, oldIndex, newIndex) } : col,
      );
      updateColumns(next);
      return;
    }

    // Moving across columns.
    const toCol = columns[toColIndex];
    const insertIndex = overIsEmptyZone
      ? toCol.cards.length
      : toCol.cards.findIndex((c) => c.id === overId);
    const next = columns.map((col, i) => {
      if (i === fromColIndex)
        return { ...col, cards: col.cards.filter((c) => c.id !== card.id) };
      if (i === toColIndex) {
        const cards = [...col.cards];
        cards.splice(insertIndex === -1 ? cards.length : insertIndex, 0, card);
        return { ...col, cards };
      }
      return col;
    });
    updateColumns(next);
  }

  const activeCard = activeCardId
    ? columns.flatMap((c) => c.cards).find((c) => c.id === activeCardId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-start gap-3 overflow-x-auto pb-2">
        <SortableContext
          items={columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column) => (
            <BoardColumnView
              key={column.id}
              column={column}
              onRename={(title) => renameColumn(column.id, title)}
              onDelete={() => deleteColumn(column.id)}
              onAddCard={() => addCard(column.id)}
              onRenameCard={renameCard}
              onSetCardIcon={setCardIcon}
              onDeleteCard={deleteCard}
            />
          ))}
        </SortableContext>
        <button
          type="button"
          onClick={addColumn}
          aria-label="Add column"
          className="text-text-faint hover:bg-secondary hover:text-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className="border-border bg-card w-64 rounded-md border p-3 text-sm shadow-lg">
            {activeCard.icon && <span className="mr-1.5">{activeCard.icon}</span>}
            {activeCard.title || "Untitled card"}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface BoardColumnViewProps {
  column: BoardColumn;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddCard: () => void;
  onRenameCard: (cardId: string, title: string) => void;
  onSetCardIcon: (cardId: string, icon: string) => void;
  onDeleteCard: (cardId: string) => void;
}

function BoardColumnView({
  column,
  onRename,
  onDelete,
  onAddCard,
  onRenameCard,
  onSetCardIcon,
  onDeleteCard,
}: BoardColumnViewProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "column" },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-muted flex w-64 shrink-0 flex-col rounded-lg p-2 ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="mb-1 flex items-center gap-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${column.title} column`}
          className="text-text-faint hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
        <span
          className={`flex min-w-0 flex-1 items-center gap-1 rounded px-2 py-1 text-sm font-semibold ${COLUMN_COLOR_CLASSES[column.color]}`}
        >
          {column.icon && <span>{column.icon}</span>}
          <input
            value={column.title}
            onChange={(e) => onRename(e.target.value)}
            aria-label="Column title"
            className="min-w-0 flex-1 truncate bg-transparent outline-none"
          />
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${column.title} column`}
          className="text-text-faint hover:text-destructive flex size-6 shrink-0 items-center justify-center rounded"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <DroppableCardList columnId={column.id}>
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1.5">
            {column.cards.map((card) => (
              <BoardCardItem
                key={card.id}
                card={card}
                onRename={(title) => onRenameCard(card.id, title)}
                onSetIcon={(icon) => onSetCardIcon(card.id, icon)}
                onDelete={() => onDeleteCard(card.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DroppableCardList>

      <button
        type="button"
        onClick={onAddCard}
        aria-label={`Add card to ${column.title || "column"}`}
        className="text-text-faint hover:bg-secondary hover:text-foreground mt-1.5 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm"
      >
        <Plus className="size-3.5" />
        New
      </button>
    </div>
  );
}

/** Makes the column droppable even when it has zero cards to land on top of. */
function DroppableCardList({ columnId, children }: { columnId: string; children: ReactNode }) {
  const { setNodeRef } = useSortable({
    id: `col-drop-${columnId}`,
    data: { type: "empty-zone" },
  });
  return (
    <div ref={setNodeRef} className="min-h-2">
      {children}
    </div>
  );
}

interface BoardCardItemProps {
  card: BoardColumn["cards"][number];
  onRename: (title: string) => void;
  onSetIcon: (icon: string) => void;
  onDelete: () => void;
}

function BoardCardItem({ card, onRename, onSetIcon, onDelete }: BoardCardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card" },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-border bg-card group/card flex items-start gap-1 rounded-md border p-2 text-sm shadow-sm ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${card.title || "card"}`}
        className="text-text-faint hover:text-foreground mt-0.5 flex shrink-0 cursor-grab touch-none items-center justify-center opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Set card icon"
            className="text-text-faint hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded"
          >
            {card.icon ?? <Smile className="size-3.5" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="grid w-auto grid-cols-5 gap-0.5 p-1.5">
          {CARD_ICONS.map((icon) => (
            <DropdownMenuItem
              key={icon}
              onSelect={() => onSetIcon(icon)}
              className="flex size-7 items-center justify-center p-0 text-base"
            >
              {icon}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        value={card.title}
        onChange={(e) => onRename(e.target.value)}
        placeholder="Untitled card"
        aria-label="Card title"
        className="min-w-0 flex-1 bg-transparent outline-none"
      />
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete card"
        className="text-text-faint hover:text-destructive flex size-5 shrink-0 items-center justify-center rounded opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
