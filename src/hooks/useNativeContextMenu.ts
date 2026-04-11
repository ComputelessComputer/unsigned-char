import { LogicalPosition } from "@tauri-apps/api/dpi";
import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { type MouseEvent, useCallback } from "react";

export type MenuItemDef =
  | {
      id: string;
      text: string;
      action: () => void;
      disabled?: boolean;
    }
  | { separator: true };

type ContextMenuEvent = MouseEvent<HTMLElement> | globalThis.MouseEvent;
type MenuPopupPoint = {
  x: number;
  y: number;
};

export async function showNativeMenu(
  items: MenuItemDef[],
  options?: {
    event?: ContextMenuEvent;
    at?: MenuPopupPoint;
  },
) {
  options?.event?.preventDefault();
  options?.event?.stopPropagation();
  const menuItems = await Promise.all(
    items.map((item) =>
      "separator" in item
        ? PredefinedMenuItem.new({ item: "Separator" })
        : MenuItem.new({
            id: item.id,
            text: item.text,
            enabled: !item.disabled,
            action: item.action,
          }),
    ),
  );

  const menu = await Menu.new({ items: menuItems });
  await menu.popup(
    options?.at ? new LogicalPosition(options.at.x, options.at.y) : undefined,
  );
}

export async function showNativeContextMenu(items: MenuItemDef[], event: ContextMenuEvent) {
  await showNativeMenu(items, { event });
}

export function useNativeContextMenu(items: MenuItemDef[]) {
  return useCallback(
    (event: MouseEvent<HTMLElement>) => {
      void showNativeContextMenu(items, event);
    },
    [items],
  );
}
