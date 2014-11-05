///<reference path='../../typings/jstree/jstree.d.ts'/>
/// <reference path="index.ts"/>

class FileManager {
  FTree:any = [
    {"text":"default", "id":"default", "children":[]}
  ];
  FIndex:any = [[]];
  constructor() {
    this.FIndex["default"] = 0;

  }


  ref() : any {
    return $('#sidebar').jstree(true);
  }

  setFolder(sel: string, fname: string) {
    if(!this.ref().create_node(sel, {text:fname})){
      alert("Error");
      return false;
    }
    this.ref().open_node(sel);
    return true;
  }

  setFile(selectedPos: string, fname: string) {
    if(!this.ref().create_node(selectedPos, {text:fname, type:'file'})){
      alert("Error");
      return false;
    }
    this.ref().open_node(selectedPos);
    return true;
  }

  getFile(obj: any) {
    var path = this.getCurrentPath("_");

  }

  getDefaultNode() {
    return "default";
  }

  getSelectedNode() : string {
    var selectedNodes = this.ref().get_selected();
    return selectedNodes[0];
  }

  getCurrentType() : string {
    return this.ref().get_type(this.getSelectedNode());
  }

  getCurrentPath(delim: string = "/") : string {
    return this.ref().get_path(this.getSelectedNode(),delim);
  }

  show() {
    console.log(this.FTree);
  }

}
