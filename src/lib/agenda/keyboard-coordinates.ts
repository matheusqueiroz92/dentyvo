import {
  closestCorners,
  getFirstCollision,
  KeyboardCode,
  type DroppableContainer,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";

const DIRECOES = [
  KeyboardCode.Down,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Left,
] as string[];

/**
 * Navegação por teclado entre slots droppable da grade (não usa Sortable).
 * Espaço/Enter inicia e confirma; setas movem para o próximo slot na direção.
 */
export const agendaKeyboardCoordinateGetter: KeyboardCoordinateGetter = (
  event,
  { context: { active, droppableRects, droppableContainers, collisionRect } },
) => {
  if (!DIRECOES.includes(event.code)) {
    return undefined;
  }

  event.preventDefault();

  if (!active || !collisionRect) {
    return undefined;
  }

  const filtrados: DroppableContainer[] = [];

  for (const entry of droppableContainers.getEnabled()) {
    if (!entry || entry.disabled) continue;
    const rect = droppableRects.get(entry.id);
    if (!rect) continue;

    switch (event.code) {
      case KeyboardCode.Down:
        if (collisionRect.top < rect.top) filtrados.push(entry);
        break;
      case KeyboardCode.Up:
        if (collisionRect.top > rect.top) filtrados.push(entry);
        break;
      case KeyboardCode.Left:
        if (collisionRect.left > rect.left) filtrados.push(entry);
        break;
      case KeyboardCode.Right:
        if (collisionRect.left < rect.left) filtrados.push(entry);
        break;
    }
  }

  const colisoes = closestCorners({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: filtrados,
    pointerCoordinates: null,
  });
  const maisProximo = getFirstCollision(colisoes, "id");
  if (maisProximo == null) return undefined;

  const novo = droppableRects.get(maisProximo);
  if (!novo) return undefined;

  return { x: novo.left, y: novo.top };
};
