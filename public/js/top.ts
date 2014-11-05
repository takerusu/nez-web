///<reference path="../../typings/jquery/jquery.d.ts" />
///<reference path="../../typings/ace/ace.d.ts" />
///<reference path='../../typings/config/config.d.ts'/>

var pegEditor;
var inputEditor;
var navbarId = ["navbar-overview", "navbar-documents", "navbar-playground"];
var contentId = ["overview", "documents", "playground"];
var editorId = ["peg4d", "input", "output"];
var inputFocus = "both";

$(function() {
    // 初期化
    pegEditor = ace.edit("pegEditor");
    pegEditor.setTheme("ace/theme/xcode");
    pegEditor.getSession().setMode("ace/mode/c_cpp");
    (<any>pegEditor).setFontSize(14);

    inputEditor = ace.edit("inputEditor");
    inputEditor.setTheme("ace/theme/xcode");
    inputEditor.getSession().setMode("ace/mode/markdown");
    (<any>inputEditor).setFontSize(14);

    $("#" + contentId[0]).css({left: "0px"});
    $("#" + navbarId[0] + " > span").attr("class", "navbar-content-active");
    for(var i = 1; i < contentId.length; i++){
      $("#" + contentId[i]).css({height: "80%"});
      resizeTextarea();
    }
    //

    $(window).resize(function() {
      var width = $(window).width();
      var sidebarW = $('.sidebar-right').width();
      $('.sidebar-right').css("left", width - sidebarW + "px");
      resizeTextarea();
    });

    $(".navbar-item").click(function(){
      var id = $(this).attr("id");
      var num;
      var hiddenLeft = "-" + ($(window).width() + 1200) + "px";
      for(var i = 0; i < navbarId.length; i++){
        //var transitionTime = Number($("#" + contentId[i]).css("transition").split(" ")[1].replace("s", "")) * 1000 + 100;
        if(id == navbarId[i]){
          $("#" + contentId[i]).css({left: "0", opacity: 1});
          $("#" + navbarId[i] + " > span").attr("class", "navbar-content-active");
          num = i;
        } else {
          $("#" + contentId[i]).css({left: hiddenLeft, opacity: 0});
          $("#" + navbarId[i] + " > span").attr("class", "navbar-content");
        }
      }
      //if Playground, Title "NEZ" is hidden
      if(num == 2){
        $(".container").css({top: "-91px", height: "100%"});
      } else {
        $(".container").css({top: "0", height: "100%"});
      }
      });

    /*$(".input-area > .collapse-block > .ground-label > .text").click(function(){
      var id = $(this).attr("id");
      var notFocusId;
      if(id == "input"){
        notFocusId = "peg4d";
      } else {
        notFocusId = "input";
      }
      var target = ".collapse-block[id='" + id + "']";
      var notTarget = ".collapse-block[id='" + notFocusId + "']";
      switch(inputFocus){
        case "both":
          inputToggle(id, target, notTarget, id, notFocusId);
          break;
        case "input":
          if(id != "input"){
            inputToggle("input", target, notTarget, id, notFocusId);
          } else {
            inputToggle("both", target, notTarget, id, notFocusId);
          }
          break;
        case "peg4d":
          if(id != "peg4d"){
            inputToggle("peg4d", target, notTarget, id, notFocusId);
          } else {
            inputToggle("both", target, notTarget, id, notFocusId);
          }
          break;
      }
      });*/

      $("#run").click(runCallback);
});

function runNez(source, p4d, callback, onerror){
  $.ajax({
    type: "POST",
    url: Config.basePath + "/run",
    data: JSON.stringify({source: source, p4d: p4d}),
    dataType: 'json',
    contentType: "application/json; charset=utf-8",
    success: callback,
    error: onerror
  });
}

function runCallback(e: Event){
  var p4d = pegEditor.getValue();
  var src = inputEditor.getValue();
  runNez(src, p4d, function(res){
    console.log(res);
    }, () => {
      console.log("sorry");
    });
}

function resizeTextarea(toSize?){
  if(toSize){
    for(var i = 0; i < editorId.length; i++){
      var target = ".collapse-block[id='" + editorId[i] + "']";
      if(i != 2){
        var divHeight = $(".container").outerHeight(true) * toSize / 2;
      } else {
        var divHeight = $(".container").outerHeight(true) * toSize;
      }
      var headHeight = $(target + " > .ground-label").outerHeight(true);
      $(target + " > pre").css("height", divHeight - headHeight - 2 + "px");
      $(target + " > textarea").css("height", divHeight - headHeight - 1 + "px");
    }
  } else {
    for(var i = 0; i < editorId.length; i++){
      var target = ".collapse-block[id='" + editorId[i] + "']";
      var divHeight = $(target).height();
      var headHeight = $(target + " > .ground-label").outerHeight(true);
      $(target + " > pre").css("height", divHeight - headHeight - 2 + "px");
      $(target + " > textarea").css("height", divHeight - headHeight - 1 + "px");
    }
  }
}

function inputToggle(toId, target, notTarget, id, notFocusId){
  if(toId != "both"){
    inputFocus = id;
    var headHeight = $(target + " > .ground-label").outerHeight(true);
    var textareaHeight = $(".input-area").outerHeight(true) * 0.9 - headHeight - 2;
    $(target).css("height", "90%");
    $(target + " > pre").css({"display": "", "opacity": "1","height": textareaHeight + "px"});
    $(notTarget).css("height", "auto");
    $(notTarget + " > pre").css({height:"0", opacity: "0", "display": "none"});
  } else {
    inputFocus = "both";
    var headHeight = $(target + " > .ground-label").outerHeight(true);
    var textareaHeight = $(".input-area").outerHeight(true) * 0.5 - headHeight - 2;
    $(notTarget).css("height", "auto");
    $(notTarget + " > pre").css({height:"0", opacity: "0", "display": "none"});
    $(target).css("height", "auto");
    $(target + " > pre").css({height:"0", opacity: "0", "display": "none"});
    $(notTarget).css("height", "50%");
    $(notTarget + " > pre").css({"display": "", "opacity": "1","height": textareaHeight + "px"});
    $(target).css("height", "50%");
    $(target + " > pre").css({"display": "", "opacity": "1","height": textareaHeight + "px"});
  }
}
