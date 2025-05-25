import { Breakpoint, Dimensions, ImageSize } from "components-react";


export type SizeRecords = {
  [key in Breakpoint]?: ImageSize;
};

export interface ActionResult {
  ok: boolean;
  status: number;
}

export interface UploadResult extends ActionResult {
  data?: Dimensions;
}

export interface ResizeResult extends ActionResult {
  data?: ImageSize;
  sizes?: SizeRecords;
}