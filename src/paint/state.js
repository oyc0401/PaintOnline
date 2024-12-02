import { observable, configure } from "mobx";

configure({ enforceActions: "never" }); // strict-mode 비활성화

export const PaintJSState = observable({
  undos:[],
  redos:[],
});
