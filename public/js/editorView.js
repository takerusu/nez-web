/// <reference path="FileManager.ts"/>

//var editor = ace.edit("editor");
//editor.setTheme("ace/theme/twilight");
//editor.getSession().setMode("ace/mode/c_cpp");

var selectedNode;

$(function() {

  $('#sidebar').jstree({
  'core': {
    'check_callback' : true,
    "data": Aspen.Files.Tree.FTree
  },
  "types" : {
    "default" : {
      "icon" : "glyphicon glyphicon-folder-open"
    },
    "file" : {
      "icon" : "glyphicon glyphicon-file",
      "valid_children" : []
    }
  },
    "plugins": ["types", "unique", "sort", "wholerow"]
  });

  var ref = $('#sidebar').jstree(true);
  $('#sidebar').on("changed.jstree", function (e, data) {
    selectedNode = Aspen.Files.Tree.getSelectedNode();
    console.log(Aspen.Files.Tree.getCurrentPath());

    Aspen.Files.Tree.getFile(selectedNode);

  });

  $('#add-folder-btn').click(function() {
    if(!selectedNode) {
      alert("追加するフォルダを選択してください");
      return false;
    }
    if(Aspen.Files.Tree.getCurrentType() === "file") {
      alert("フォルダを選択してください");
      return false;
    }
    var fname = prompt("フォルダ名を入力してください","");
    if(!fname) {
      alert("フォルダ名を入力してください");
      return false;
    }

    Aspen.Files.Tree.setFolder(selectedNode, fname);

  });

  var sbFlag = false;
  var editorW = $('#editor').css("width");
  $('.sidebar-btn').click(function() {
    if($(".sidebar-right").css("left")) {
      $('.sidebar').css("opacity", "1");
      var sidebarW = $('.sidebar').width();
      $('.sidebar').css("left", "0");
      $('.sidebar-btn').css("margin-left", sidebarW + "px");
      $('.editor-view').css("margin-left", sidebarW + "px");
      $('.btnglyph').css("transform","rotate(180deg)");

      $('#editor').css("width", function(index, value) {
        console.log(index,value);
        var re = new RegExp("[0-9]+");
        var num = re.exec(value);
        var w = re.exec(sidebarW);
        num = num[0] - w[0];
        sbFlag = true;
        return num + "px";
      });
    } else {
      $('.sidebar').css("left", "-300px");
      $('.sidebar-btn').css("margin-left", "0");
      $('.editor-view').css("margin-left", "0");
      $('.btnglyph').css("transform","rotate(0deg)");
      $('#editor').css("width", editorW);
      $('.sidebar').css("opacity", "0");
      sbFlag = false;
    }
  });

});
