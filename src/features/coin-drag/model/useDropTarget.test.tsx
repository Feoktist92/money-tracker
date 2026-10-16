import { act, create } from 'react-test-renderer';

import { collectCandidates } from './registry';
import type { DragSource } from './types';
import { useDropTarget } from './useDropTarget';

const account: DragSource = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' };
const food = { kind: 'category', id: 'food', name: 'Продукты' } as const;

function Target({ enabled }: { enabled?: boolean }) {
  useDropTarget(food, undefined, enabled);
  return null;
}

const registered = () => collectCandidates(account).map((entry) => entry.info.id);

describe('useDropTarget', () => {
  it('включённая плитка регистрируется целью и снимается при размонтировании', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Target />);
    });
    expect(registered()).toEqual(['food']);
    act(() => tree.unmount());
    expect(registered()).toEqual([]);
  });

  it('плитка-двойник (enabled = false, превью в шторке) цели не регистрирует', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Target enabled={false} />);
    });
    expect(registered()).toEqual([]);
    act(() => tree.unmount());
  });
});
