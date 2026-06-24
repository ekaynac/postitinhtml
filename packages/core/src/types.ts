export interface Note {
  id: string; text: string; x: number; y: number; color: string;
  authorName: string; authorId?: string; createdAt: number; updatedAt: number; z: number;
}
export interface BoardData { notes: Note[] }
export type IdentityResolver = () => { name: string; id?: string };
export interface PostitsConfig { host?: string; room?: string; identity?: IdentityResolver; palette?: string[]; boardId?: string }

export const DEFAULT_PALETTE = ["#FEF08A","#FBCFE8","#BFDBFE","#BBF7D0","#FED7AA"] as const;
export const DEFAULT_COLOR = "#FEF08A";
export const MAX_TEXT_LENGTH = 500;
export const NOTE_SIZE = { w: 220, h: 200 } as const;
export const OVERLAY_Z_INDEX = 2147483000;
export const DRAG_COMMIT_MS = 50;
export const BOARD_ID = "postits-board";
export const GUEST_NAME = "Guest";
