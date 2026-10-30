/** Фаза жеста: dragging — монета в руке, returning — летит обратно в лоток, idle — жеста нет. */
export type DragPhase = 'idle' | 'dragging' | 'returning';

/** Что тянут: монета дохода (категория дохода) или монета счёта. */
export interface DragSource {
  kind: 'income' | 'account';
  id: string;
  name: string;
  /** Имя значка из реестра AppIcon, для призрака монеты. */
  icon: string;
  /** Ключ цвета: у монеты счёта — accounts.color, у монеты дохода — цвет категории дохода (categories.color). */
  color?: string;
}

/** Куда можно бросить: монета счёта в лотке или плитка категории расхода. */
export interface DropTargetInfo {
  kind: 'account' | 'category';
  id: string;
  name: string;
}

/** Прямоугольник цели в координатах окна, измеренный в момент начала жеста. */
export interface TargetRect {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const targetKey = (target: Pick<DropTargetInfo, 'kind' | 'id'>): string => `${target.kind}:${target.id}`;
