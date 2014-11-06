///<reference path="../../typings/jquery/jquery.d.ts" />

declare var source
declare var createNodeViewFromP4DJson

$(function(){
  createNodeViewFromP4DJson(JSON.parse(source));
});
