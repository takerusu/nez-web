///<reference path='../../typings/jquery/jquery_plugins.d.ts'/>
///<reference path='../../typings/ace/ace.d.ts'/>
///<reference path='../../typings/jstree/jstree.d.ts'/>
///<reference path='../../typings/config/config.d.ts'/>
/// <reference path="FileManager.ts"/>

declare var CodeMirror: any;
declare function saveAs(data :Blob, filename: String): void;
var _ua: any;


module C2JS {

    export function GetHelloWorldSource(): string {
        return "#include <stdio.h>\n\nint main() {\n    printf(\"hello, world!\\n\");\n    return 0;\n}";
    }

    export interface Response {
        source:   string;
        error:    string;
        message:  string;
    }

    export class Editor {
        private editor: any;
        private errorLineIds: number[] = [];
        constructor($editor: JQuery) {
            this.editor = ace.edit($editor.attr('id'));
            this.editor.setTheme("ace/theme/xcode");
            this.editor.getSession().setMode("ace/mode/c_cpp");
            this.editor.setFontSize(14);

            //this.ResetHelloWorld();
        }

        OnChange(callback: (e: Event)=>void): void {
            this.editor.on("change", callback);
        }

        GetValue(): string {
            return this.editor.getValue();
        }

        SetValue(text: string): void {
            this.editor.setValue(text);
            this.editor.clearSelection();
            this.editor.gotoLine(0);
        }

        Clear(): void{
            this.SetValue("");
        }

        Disable(): void {
            this.editor.setReadOnly(true);
            $("#editor").css({"background-color": "#eee"});
        }

        Enable(): void {
            this.editor.setReadOnly(false);
            $("#editor").css({"background-color": "#fff"});
        }

        SetErrorLines(lines: any[]){
            var annotations = [];
            var session =this.editor.getSession();
            for(var i = 0; i < lines.length; ++i){
                var row = lines[i].n - 1;
                annotations.push({
                    row: row,
                    type: "error",
                    text: lines[i].t
                });
                var range = session.highlightLines(row, row, "error_line");
                this.errorLineIds.push(range.id);
            }
            this.editor.getSession().setAnnotations(annotations);
        }

        RemoveAllErrorLine(): void {
            var session = this.editor.getSession();
            session.clearAnnotations();
            for(var i = 0; i < this.errorLineIds.length; i++) {
                session.removeMarker(this.errorLineIds[i]);
            }
        }

        ResetHelloWorld(): void {
            this.SetValue(GetHelloWorldSource());
        }

        ClearHistory(): void {
            this.editor.getUndoManager().reset();
        }

        ContainsMultiByteSpace(): boolean {
            return this.editor.getValue().match(/　/);
        }

        ReplaceMultiByteSpace(): void {
            this.editor.setValue(this.editor.getValue().replace(/　/g, "  "));
        }
    }

    export class Output {
        constructor(public $output: JQuery){
        }

        Print(val: string): void {
            this.$output.append(val);
        }

        private static ExpandTab(val: string, width: number): string {
            var tsv = val.split("\t");
            var ret = "";
            var spase = "                "; // 16 spaces
            var n = tsv.length;
            for(var i = 0; i < n; ++i){
                ret += tsv[i];
                if(n - i > 1){
                    ret += spase.substr(0, width - ret.length % width);
                }
            }
            return ret;
        }

        PrintFromC(val: string): void {
            val = Output.ExpandTab(val, 4);
            var obj = document.createElement('samp');
            if (typeof obj.textContent != 'undefined') {
                obj.textContent = val;
            } else {
                obj.innerText = val;
            }
            this.$output.append("<samp>" + obj.innerHTML.replace(/ /g, "&nbsp;") + "</samp><br>");
        }

        PrintLn(val: string): void {
            this.$output.append(val + '<br>\n');
        }

        PrintErrorLn(val: string): void {
            this.$output.append('<span class="text-danger">' + val + '</span><br>');
        }

        Prompt(): void {
            this.$output.append('$ ');
        }

        Clear(): void {
            this.$output.text('');
        }

    }

    export class FileModel {
        private BaseName: string;
        private Name: string;
        private Path: string;
        private PathArray: string[];

        constructor(Name: string, Path: string = "") {
            this.SetName(Name, Path);
        }

        SetName(text: string, Path: string): void {
            if(Path === "") {
              Path = "default";
            }
            this.Name = text.replace(/\..*/, ".c");
            this.BaseName = this.Name.replace(/\..*/, "");
            this.Path = Path;
            this.PathArray = Path.split("/");
            //this.BaseName = this.PathArray.join("_") + "_" + this.BaseName;
        }

        GetName(): string {
          return this.Name;
          //return this.PathArray.join("_") + "_" + this.Name;
        }

        GetNoPathName():string {
          return this.Name;
        }

        GetBaseName(): string {
            return this.BaseName;
        }

        GetPath(): string {
          return this.Path;
        }

        GetPathArray(): string[] {
          return this.PathArray;
        }

        GetFullPathName(): string {
          return this.Path + "/" + this.Name;
        }

        GetFullPathBaseName(): string {
          return this.Path + "/" + this.Name.replace(/\..*/, "");
        }

    }

    export class FileLoader {
      private FileModel: FileModel;
      private UI: JQuery;

      constructor() {
        this.UI = $('#file-name-lists');
        this.SetItem();
      }

      SetItem() {
        var filename = location.pathname.split("/").pop();
        if(filename === "editor" || filename === "") {
          filename = "program";
        } else {
          filename = "subject" + filename;
        }
        var content: string = $("#file-content").text();
        var timestamp;
        if($("#file-timestamp").text() !== "") {
          timestamp = new Date($("#file-timestamp").text());
        } else {
          timestamp = "";
        }
        var oldcontent = sessionStorage.getItem(filename + ".c");
        var olddate = sessionStorage.getItem(filename + ".time");
        var oldtimestamp;
        if(oldcontent !== null && olddate !== null) {
          oldtimestamp = new Date(olddate);
          if(timestamp < oldtimestamp) {
            content = oldcontent;
            timestamp = oldtimestamp;
          }
        }
        //if(content === "") {
          //content = GetHelloWorldSource();
        //}
        sessionStorage.setItem(filename + ".c", content);
        sessionStorage.setItem(filename + ".time", timestamp);

        this.FileModel = new FileModel(filename + ".c");
      }

      Empty() {
        return this.FileModel == null;
      }

      GetCurrent() {
        return this.FileModel;
      }

      Show() {
        this.UI.prepend($('#file-list-template').tmpl(this.FileModel));
        $("#" + this.GetCurrent().GetBaseName()).parent().addClass('active');
        $("#" + this.GetCurrent().GetBaseName()).click(function() {
          return false;
        });
      }

    }

    export class FileCollection {
        private FileModels: FileModel[] = [];
        private UI: JQuery;
        private ActiveFileName: string;
        private ActiveFileIndex: number;
        private defaultNameKey: string = 'filename:defaultNameKey';
        public Tree: FileManager = new FileManager();

        constructor() {
            this.UI = $('#file-name-lists');
            this.ActiveFileName = localStorage.getItem(this.defaultNameKey) || "default_program.c";
            this.ActiveFileIndex = 0;
            for(var i = 0; i < localStorage.length; i++) {
                var keyArray = localStorage.key(i).split("_");
                var key = keyArray.pop();
                var path = "";
                if(localStorage.key(i) == this.defaultNameKey || !key.match(/.*\.c/)) {
                    continue;
                }

                path = keyArray.join("/");

                var file = new FileModel(key, path);
                var index = this.FileModels.push(file) - 1;
                if(localStorage.key(i) == this.ActiveFileName) {
                    this.ActiveFileIndex = index;
                }
            }

            //First access for c2js
            if(this.FileModels.length == 0) {
                var pArray = this.ActiveFileName.split("_");
                var fname = pArray.pop();
                var path = pArray.join("/");
                var file = new FileModel(fname, path);
                var index = this.FileModels.push(file) - 1;
                this.ActiveFileIndex = index;
                localStorage.setItem(this.defaultNameKey, "default_program.c");
                localStorage.setItem("default_program.c", GetHelloWorldSource());
            }
        }

        Append(NewFile: FileModel, callback: (e:Event) => void) {
            this.FileModels.push(NewFile);
            this.UI.prepend($('#file-list-template').tmpl([NewFile]));
            $("#" + NewFile.GetBaseName()).click(callback);
        }

        private GetIndexOf(BaseName: string): number {
            for(var i = 0; i < this.FileModels.length; i++) {
                if(this.FileModels[i].GetBaseName() == BaseName) {
                    return i;
                }
            }
            return -1;
        }

        GetCurrent(): FileModel {
            return this.FileModels[this.ActiveFileIndex];
        }

        private RemoveActiveClass(): void {
            if(!this.Empty()){
                $("#" + this.GetCurrent().GetBaseName()).parent().removeClass('active');
            }
        }

        private AddActiveClass(): void {
            if(!this.Empty()){
                $("#" + this.GetCurrent().GetBaseName()).parent().addClass('active');
            }
        }

        SetCurrent(BaseName: string): void {
            this.RemoveActiveClass();
            this.ActiveFileName = BaseName + '.c';
            this.ActiveFileIndex = this.GetIndexOf(BaseName);
            this.AddActiveClass();
            localStorage.setItem(this.defaultNameKey, this.ActiveFileName);
        }

        Show(callback: (e:Event)=>void): void {
            this.UI.prepend($('#file-list-template').tmpl(this.FileModels));
            this.AddActiveClass();
            for(var i = 0; i < this.FileModels.length; i++) {
                $("#" + this.FileModels[i].GetBaseName()).click(callback);
            }
        }

        private RemoveByBaseName(BaseName: string): void {
            var i = this.GetIndexOf(BaseName);
            if(i == -1) {
                return;
            }
            $($("#" + BaseName).parent().get(0)).remove();
            this.FileModels.splice(i,1);
            localStorage.removeItem(BaseName + '.c');
        }

        Rename(oldBaseName: string, newname: string, contents: string, Callback: any, DB: SourceDB, path: string): void {
            if(path === "") path = "default";
            this.Remove(path + "_" + oldBaseName);
            var file = new FileModel(newname, path.split("_").join("/"));
            this.Append(file, Callback);
            this.SetCurrent(file.GetBaseName());
            DB.Save(file.GetName(), contents);
        }

        Remove(BaseName: string): void {
            if(this.FileModels.length > 0){
                var removedIndex = this.GetIndexOf(BaseName);
                var newIndex = removedIndex <= 0 ? 0 : removedIndex - 1;
                this.SetCurrent(this.FileModels[newIndex].GetBaseName());
                this.RemoveByBaseName(BaseName);
                this.AddActiveClass();
            }
        }

        Clear(): void {
            if(this.FileModels.length > 0){
                $(".file-tab").remove();
                this.FileModels = [];
                for(var name in localStorage){
                    localStorage.removeItem(name);
                }
            }
        }

        Empty(): boolean {
            return this.FileModels.length == 0;
        }

        MakeUniqueName(Name: string): string {
            for(var i = 0; i < this.FileModels.length; i++) {
                if(this.FileModels[i].GetName() == Name) {
                    return Name.replace(/\.c/g, "_1.c");
                }
            }
            return Name;
        }

        GenerateFTree() {
          for(var i = 0; i < this.FileModels.length; i++) {
            var fi = this.Tree.FIndex;
            var ft = this.Tree.FTree;
            var pArray = this.FileModels[i].GetPathArray();
            for(var j in pArray) {
              if(typeof fi[pArray[j]] === "undefined") {
                ft.push({"text": pArray[j], "children": []});
                fi[pArray[j]] = ft.length - 1;
                fi[ft.length - 1] = [];
              }

              ft = ft[fi[pArray[j]]].children;
              fi = fi[fi[pArray[j]]];
            }
            ft.push({"text":this.FileModels[i].GetNoPathName(), "type":"file"});
          }
        }

    }

    export class SourceDB {
        constructor() {
        }

        Save(fileName: string, source: string): void {
            sessionStorage.setItem(fileName, source);
            var timeName = fileName.replace(/\..*/, ".time");
            var date = new Date();
            sessionStorage.setItem(timeName, date.toString());
        }

        Load(fileName: string): string {
            return sessionStorage.getItem(fileName);
        }

        Delete(fileName: string): void {
            return sessionStorage.removeItem(fileName);
        }

        Exist(fileName: string): boolean {
            return sessionStorage.getItem(fileName) != null;
        }

    }

    export function getSubjectId(): Number {
        var pathes = location.pathname.split("/");
        var _subjectId = pathes[pathes.length - 1];
        return (_subjectId == "editor")? -1 : parseInt(_subjectId);
    }

    export function Compile(source, option, filename, isCached, Context, callback, onerror) {
        $("#peditor").hide();
        $("#poplar-title").hide();
        if(isCached) {
            var subjectId = getSubjectId();
            $.ajax({
                type: "POST",
                url: Config.basePath + "/compile",
                data: JSON.stringify({source: source, option: option, filename: filename, subjectId: subjectId}),
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                success: callback,
                error: onerror
            });
            saveInServer(subjectId, source);
        } else {
            setTimeout(callback,200,Context);
        }
    }

    export function saveInServer(subjectId, editorContent) {
            var callback = () => { console.log("ok."); };
            if(subjectId == -1 || subjectId == null) {
                return;
            }
            (<any>$).ajax({
                type: "POST",
                url: Config.basePath + "/save",
                data: JSON.stringify({content: editorContent, subjectId: subjectId}),
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                success: callback,
                error: onerror
            });
        }

    export function Run(source: string, ctx, out){
        ctx.source = source;
        var Module = { print: function(x){ out.PrintFromC(x); } };
        try {
            var exe = new Function("Module", source);
            exe(Module);
        }catch(e) {
            out.Print(e);
        }
        out.Prompt();
    }

    export function TranslateMessageToJapanese(text: string): string{
        text = text.replace(/&nbsp;/g, " ");
        var wordtable = {
            "variable":"変数",
            "parameter":"引数",
            "argument":"引数",
            "identifier":"変数または関数",
            "pointer":"ポインタ",
            "integer":"整数",
            "struct":"構造体",
            "union":"共用体",
        };
        var rules: any = {};
        rules["unused (\\w+) ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + " " + RegExp.$2 + " は使われていません"; });
        rules["expression result unused"]
            = (()=>{ return "計算結果が使われていません"; });
        rules["equality comparison result unused"]
            = (()=>{ return "比較結果が使われていません"; });
        rules["self-comparison always evaluates to true"]
            = (()=>{ return "自分自身との比較は常に真です (この式には意味がありません)"; });
        rules["explicitly assigning a variable of type ('.*?') to itself"]
            = (()=>{ return "自分自身への代入は意味がありません"; });
        rules["using the result of an assignment as a condition without parentheses"]
            = (()=>{ return "代入演算の結果を条件式に使用しています (代入 '=' と比較 '==' を間違えていませんか？)"; });
        rules["(\\w+) (loop|statement) has empty body"]
            = (()=>{ return RegExp.$1 + "文の中身がありません"; });
        rules["type specifier missing, defaults to 'int'"]
            = (()=>{ return "型名がありません (int型と判断しました…型名の省略は推奨されません)"; });
        rules["implicitly declaring library function ('.*?').*"]
            = (()=>{ return "標準ライブラリ関数 " + RegExp.$1 + " を暗黙的に使用しています (警告を消すには正しいヘッダファイルをインクルードしてください)"; });
       　rules["incompatible redeclaration of library function ('.*?')"]
            = (()=>{ return "標準ライブラリ関数 " + RegExp.$1 + " を異なる定義で再宣言しています"; });
        rules["implicit declaration of function ('.*?') is invalid in C99"]
            = (()=>{ return "関数 " + RegExp.$1 + " は宣言されていません"; });
        rules["implicit conversion from ('.*?') to ('.*?') changes value from (.+?) to (.+)"]
            = (()=>{ return RegExp.$1 + "型から" + RegExp.$2 + "型への暗黙の変換により、値が " + RegExp.$3 + " から " + RegExp.$4 + "に変化します (警告を消すには ("+RegExp.$2+")"+RegExp.$3+"と書き、明示的に変換してください)"; });
        rules["incompatible (\\w+) to (\\w+) conversion returning ('.*?') from a function with result type ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + "から" + wordtable[RegExp.$2] + "への不正な変換です。戻り値は " + RegExp.$4 + " 型ですが、" + RegExp.$3 + " 型の値を返そうとしています"; });
        rules["incompatible (\\w+) to (\\w+) conversion passing ('.*?') to parameter of type ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + "から" + wordtable[RegExp.$2] + "への不正な変換です。引数は " + RegExp.$4 + " 型ですが、" + RegExp.$3 + " 型の値を渡そうとしています"; });
        rules["incompatible (\\w+) to (\\w+) conversion assigning to ('.*?') from ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + "から" + wordtable[RegExp.$2] + "への不正な変換です。 " + RegExp.$3 + " 型の変数に" + RegExp.$4 + " 型の値を代入しています"; });
       　rules["data argument not used by format string"]
            = (()=>{ return "使われていない引数があります (フォーマット文字列を確認してください)"; });
       　rules["more '%' conversions than data arguments"]
            = (()=>{ return "指定されたフォーマット文字列に対して引数が足りません (フォーマット文字列を確認してください)"; });
       　rules["control reaches end of non-void function"]
            = (()=>{ return "戻り値を返さないまま関数が終了しています (return文を書くか、戻り値の型をvoidに変更してください)"; });
       　rules["control may reaches end of non-void function"]
            = (()=>{ return "戻り値を返さないまま関数が終了する可能性があります (すべての分岐で値を返していることを確認してください)"; });
       　rules["variable ('.*?') is uninitialized when used here"]
            = (()=>{ return "初期化されていない変数 " + RegExp.$1 + " が参照されました (変数は、参照する前に必ず初期値を代入しましょう)"; });
       　rules["excess elements in array initializer"]
            = (()=>{ return "配列初期化子の要素が配列のサイズに対して多すぎます"; });

        rules['expected "FILENAME" or <FILENAME>']
            = (()=>{ return 'インクルードファイル名は "ファイル名" または <ファイル名> と書く必要があります'; });
        rules["('.*?') file not found"]
            = (()=>{ return "インクルードファイル " + RegExp.$1 + " が見つかりません。ファイル名が間違っているか、対応していないライブラリです (コンパイルは中断されました)"; });
        rules["void function ('.*?') should not return a value"]
            = (()=>{ return "関数 " + RegExp.$1 + " の戻り値はvoid型なので、値を返すことはできません。単にreturn;と書くか、戻り値の型を修正してください"; });
        rules["non-void function ('.*?') should return a value"]
            = (()=>{ return "関数 " + RegExp.$1 + " の戻り値はvoidではないため、値を返す必要があります。return文を書くか、戻り値の型をvoidに修正してください"; });
        rules["too many arguments to function call, expected (\\d+), have (\\d+)"]
            = (()=>{ return RegExp.$1 + "引数の関数に" + RegExp.$2 + "個の引数を渡しています (引数が多すぎます)"; });
        rules["too many arguments to function call, single argument ('.*?'), have (\\d+) arguments"]
            = (()=>{ return "1引数の関数に" + RegExp.$2 + "個の引数を渡しています (引数が多すぎます)"; });
        rules["too few arguments to function call, expected (\\d+), have 0"]
            = (()=>{ return RegExp.$1 + "引数の関数に引数を渡していません (引数が少なすぎます)"; });
        rules["too few arguments to function call, expected (\\d+), have (\\d+)"]
            = (()=>{ return RegExp.$1 + "引数の関数に" + RegExp.$2 + "個の引数を渡しています (引数が少なすぎます)"; });
        rules["passing ('.*?') to parameter of incompatible type ('.*?')"]
            = (()=>{ return RegExp.$2 + " 型の引数に対し、変換できない " + RegExp.$2 + " 型の値を渡すことはできません"; });
        rules["use of undeclared identifier ('.*?')"]
            = (()=>{ return "変数 " + RegExp.$1 + " は宣言されていません。変数を使用するにはあらかじめ宣言を記述する必要があります"; });
        rules["expression is not assignable"]
            = (()=>{ return "この式には代入できません"; });
        rules["called object type ('.*?') is not a function or function pointer"]
            = (()=>{ return "呼び出しを試みた型" + RegExp.$1 + "は関数ではありません"; });
        rules["non-object type ('.*?') is not assignable"]
            = (()=>{ return RegExp.$1 + "型には代入できません"; });
        rules["array type ('.*?') is not assignable"]
            = (()=>{ return "配列には代入できません (配列の要素に代入するには添字を付けてください)"; });
        rules["invalid operands to binary expression \\(('.*?') and ('.*?')\\)"]
            = (()=>{ return "不正な二項演算です (" + RegExp.$1 + "型と" + RegExp.$2 + "型の間に演算が定義されていません)"; });
        rules["invalid suffix ('.*?') on integer constant"]
            = (()=>{ return "整数定数に対する不正な接尾辞です"; });
        rules["unknown type name 'include'"]
            = (()=>{ return "未知の型名 'include' です (#include の間違いではありませんか？)"; });
        rules["unknown type name ('.*?')"]
            = (()=>{ return "未知の型名 " + RegExp.$1 + "　です"; });
        rules["redefinition of ('.*?').*"]
            = (()=>{ return RegExp.$1 + " はすでに定義されています"; });
        rules["expected ';'.*"]
            = (()=>{ return "セミコロン ; が必要です"; });
        rules["expected '}'"]
            = (()=>{ return "中括弧 } が閉じていません"; });
        rules["extraneous closing brace.*"]
            = (()=>{ return "閉じ中括弧 } が多すぎます"; });
        rules["expected '\\)'"]
            = (()=>{ return "括弧 ) が閉じていません"; });
        rules["extraneous '\\)'.*"]
            = (()=>{ return "閉じ括弧 ) が多すぎます"; });
        rules["expected expression"]
            = (()=>{ return "条件式が必要です"; });
        rules["expected parameter declarator"]
            = (()=>{ return "引数の宣言が必要です"; });
        rules["expected 'while'.*"]
            = (()=>{ return "do-while文は while(...); で終わる必要があります"; });
        rules["expected identifier or ('.*?')"]
            = (()=>{ return "関数名、変数名、または " + RegExp.$1 + " が必要です"; });
        rules["expected function body after function declarator"]
            = (()=>{ return "関数の本体が必要です"; });
        rules["expected ('.*?') after ('.*?')"]
            = (()=>{ return RegExp.$1 + " の後に " + RegExp.$2 + " が必要です"; });
        rules["must use '(.*?)' tag to refer to type ('.*?')"]
            = (()=>{ return wordtable[RegExp.$1] + "名の前に 'struct' が必要です"; });
        rules["'(.*?)' declared as an array with a negative size"]
            = (()=>{ return "負のサイズの配列は宣言できません"; });

        rules["to match this '{'"]
            = (()=>{ return "ブロックは以下の位置で開始しています"; });
        rules["to match this '\\('"]
            = (()=>{ return "括弧は以下の位置で開いています"; });
        rules["('.*?') declared here"]
            = (()=>{ return RegExp.$1 + " の宣言は以下の通りです："; });
        rules["passing argument to parameter ('.*?') here"]
            = (()=>{ return "引数 " + RegExp.$1 + " の宣言は以下の通りです："; });
        rules["please include the header (<.*?>) or explicitly provide a declaration for ('.*?')"]
            = (()=>{ return RegExp.$2 + " を使用するには #include " + RegExp.$1 + " と記述してください"; });
        rules["put the semicolon on a separate line to silence this warning"]
            = (()=>{ return "警告を消すには行末にセミコロンを書いてください"; });
        rules["previous definition is here"]
            = (()=>{ return "最初の定義は以下の通りです"; });
        rules["use '==' to turn this assignment into an equality comparison"]
            = (()=>{ return "値の比較には比較演算子 '==' を使用します"; });
        rules["use '=' to turn this equality comparison into an assignment"]
            = (()=>{ return "代入には代入演算子 '=' を使用します"; });
        rules["place parentheses around the assignment to silence this warning"]
            = (()=>{ return "間違いでない場合は、警告を消すために代入演算を()で囲んでください"; });
        rules["initialize the variable ('.*?') to silence this warning"]
            = (()=>{ return "警告を消すためには " + RegExp.$1 + " に初期値を代入してください"; });
        rules["('.*?') is a builtin with type ('.*?')"]
            = (()=>{ return RegExp.$1 + " は組み込み関数です"; });
        rules["uninitialized use occurs here"]
            = (()=>{ "ここで未初期化のまま参照されています"; });
        rules["remove the 'if' if its condition is always false"]
            = (()=>{ "本当に常に真でよい場合、if文は不要です"; });

        for(var rule in rules){
            try{
                if(text.match(new RegExp(rule))){
                    return (<any>RegExp).leftContext + rules[rule]() + (<any>RegExp).rightContext;
                }
            }catch(e){
                console.log(e);
                console.log(rule);
            }
        }
        return text;
    }

    function ConvertTerminalColor(text: string): string {
        return text.replace(/\[31m(.*)\[0m/g,'<span class="text-danger">$1</span>');
    }

    function ReplaceNewLine(text: string): string {
        return text.replace(/[\r\n|\r|\n]/g,"<br>\n");
    }

    function FormatMessage(text: string, filename: string): string {
        text = text.replace(/<U\+(.{4})>/g, function(all, code){ return String.fromCharCode(parseInt(code, 16)) })
                   .replace(/ERROR.*$/gm,"") // To remove a message that is not Clang one but Emscripten's.
                   .replace(/</gm, "&lt;")
                   .replace(/>/gm, "&gt;");

        var textlines: string[] = text.split(/[\r\n|\r|\n]/g);
        for(var i = 0; i < textlines.length; ++i){
            if(textlines[i].lastIndexOf(filename, 0) == 0){
                textlines[i] = textlines[i].replace(/ \[.*\]/gm, "");
                if(Aspen.Language == "ja"){
                    textlines[i] = TranslateMessageToJapanese(textlines[i]);
                }
                if(textlines[i+1].lastIndexOf(filename, 0) != 0){
                    var code = textlines[i+1];
                    var indicator = textlines[i+2];
                    var replacee = '';
                    if(indicator) {
                        var begin = indicator.indexOf("~");
                        var end = indicator.lastIndexOf("~") + 1;
                        replacee = code.substring(begin, end);
                    }
                    var code = replacee.length > 0 ? code.replace(replacee, "<u>" + replacee + "</u>") : code;
                    var consumedLines = 1;
                    textlines[i+1] = "<code>" + code.replace(/ /gm, "&nbsp;") + "</code>";
                    if(indicator) {
                        if(textlines[i+2].lastIndexOf(filename, 0) != 0){
                            textlines[i+2] = "<samp>" + indicator.replace(/~/g, " ")
                                                      .replace(/ /gm, "&nbsp;")
                                                      .replace(/\^/, "<span class='glyphicon glyphicon-arrow-up'></span>") + "</samp>";
                            consumedLines++;
                        }
                        if(textlines[i+3].lastIndexOf(filename, 0) != 0){
                            textlines[i+3] = "<samp>" + textlines[i+3].replace(/ /gm, "&nbsp;") + "</samp>";
                            consumedLines++;
                        }
                    }
                    i += consumedLines;
                }
            }
        }

        return textlines.join("<br>\n")
            .replace(/(\d+).\d+: (note):(.*)$/gm,    " <b>line $1</b>: <span class='label label-info'>$2</span> <span class='text-info'>$3</span>")
            .replace(/(\d+).\d+: (warning):(.*)$/gm, " <b>line $1</b>: <span class='label label-warning'>$2</span> <span class='text-warning'>$3</span>")
            .replace(/(\d+).\d+: (error):(.*)$/gm,   " <b>line $1</b>: <span class='label label-danger'>$2</span> <span class='text-danger'>$3</span>")
            .replace(/(\d+).\d+: (fatal error):(.*)$/gm,   " <b>line $1</b>: <span class='label label-danger'>$2</span> <span class='text-danger'>$3</span>");
    }


    function FormatFilename(text:string, fileName: string): string {
        return text.replace(/\/.*\.c/g,fileName+".c")
                   .replace(/\/.*\/(.*\.h)/g, "$1");
    }

    export function FormatClangErrorMessage(text: string, fileName: string): string {
        return FormatMessage(FormatFilename(ConvertTerminalColor(text), fileName), fileName);
    }

    export function CheckFileName(name: string, DB: SourceDB, path: string = "default"): string {
        var filename = name;
        if(path == "") {
          path = "default";
        } else {
          path = path.split("/").join("_");
        }
        if(filename == null) {
            return null;
        }

        if(filename == "") {
            filename = "file"+ new Date().toJSON().replace(/\/|:|\./g,"-").replace(/20..-/,"").replace(/..-..T/,"").replace(/Z/g,"").replace(/-/g,"");
        }

        if(filename.match(/[\s\t\\/:\*\?\"\<\>\|]+/)) {//"
            alert("This file name is incorrect.");
            return null;
        }

        if(filename.match(/.*\.c/) == null) {
            filename += '.c';
        }
        if(DB.Exist(path + "_" + filename)) {
            alert("'"+filename+"' already exists.");
            return null;
        }
        return filename;
    }

    export function ConfirmAllRemove(): boolean {
        return confirm('All items will be delete immediately. Are you sure you want to continue?');
    }

    export function ConfirmToRemove(BaseName: string): boolean {
        return confirm('The item "'+BaseName+'.c" will be delete immediately. Are you sure you want to continue?');
    }
}

var Aspen: any = {};

$(function () {

    var Editor: C2JS.Editor   = new C2JS.Editor($("#editor"));
    var Output: C2JS.Output   = new C2JS.Output($("#output"));
    var DB:     C2JS.SourceDB = new C2JS.SourceDB();
    var Context: any = {}; //TODO refactor C2JS.Response
    var Files: C2JS.FileLoader = new C2JS.FileLoader();

    var peditor:any = ace.edit("peditor");
    peditor.setTheme("ace/theme/xcode");
    peditor.getSession().setMode("ace/mode/c_cpp");
    peditor.setFontSize(14);


    //初期ページでは提出ボタンを出さないようにする
    if(location.pathname == Config.basePath + "/" || location.pathname == Config.basePath + "/editor") {
        if(location.pathname == Config.basePath + "/") {
            $("#poplar").hide();
        }
        var submit_button = $("#submit-file");
        submit_button.hide();
    } else {
        // A/Bテスト
        var num = parseInt($.cookie("studentNumber").slice(1));
        if(isNaN(num)) {
            num = 0;
        }
        if(num < 1464200) {
            $("#poplar").hide();
        }
        //提出ボタンの挙動
        $("#submit-file").click(function(event) {
            var subjectId = C2JS.getSubjectId();
            var callback = () => {
                alert('提出しました！');
            };
            (<any>$).ajax({
                type: "POST",
                url: Config.basePath + "/submit",
                data: JSON.stringify({content: Editor.GetValue(), subjectId: subjectId}),
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                success: callback,
                error: onerror
            });
        });
    }


    Aspen.Editor = Editor;
    Aspen.Output = Output;
    Aspen.Source = DB;
    Aspen.Context = Context;
    Aspen.Files = Files;
    Aspen.Language = "ja";
    Aspen.Debug = {};
    Aspen.Debug.DeleteAllKey = () => {
        while(localStorage.length > 1) {
            localStorage.removeItem(localStorage.key(0));
        }
    };
    Aspen.Debug.OutputClangMessage = (message, filename) => {
        Output.PrintLn('DEBUG');
        Output.PrintLn(C2JS.FormatClangErrorMessage(message, filename));
    };
    Aspen.Debug.PrintC = (message) => {
        Output.PrintFromC(message);
    };

    var changeFlag = true;
    Editor.OnChange((e: Event)=> {
        if(!Files.Empty()){
            changeFlag = true;
            DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
        }
    });

    var running = false;

    var DisableUI = () => {
        $(".disabled-on-running").addClass("disabled");
        Editor.Disable();
        running = true;
    }

    var EnableUI = () => {
        $(".disabled-on-running").removeClass("disabled");
        Editor.Enable();
        running = false;
    }

    var ChangeCurrentFile = (e: Event) => {
        if(running) return
        //Files.SetCurrent((<any>e.target).id);
        Editor.SetValue(DB.Load(Files.GetCurrent().GetName()));
        Editor.ClearHistory();
    };


    if(location.pathname != Config.basePath + "/") {
        $(".sidebar-btn-right").css({display: "inline"});
        $(".sidebar-right").css({display: "inline"});
    }

    $("#poplar").click((ev: Event) => {
        peditor.setValue("");
        var content = Editor.GetValue();
        var subjectId = C2JS.getSubjectId();
        var onerror = () => console.log("error");
        var callback = (res)=> {
            if($(".sidebar-right").css("opacity") == "0") {
                $(".sidebar-btn-right").click();
            }
            $("#peditor").show();
            $("#poplar-title").show();
            peditor.setValue(res.source);
            peditor.clearSelection();
            peditor.gotoLine(0);

            console.log(res);
        };
        $.ajax({
            type: "POST",
            url: Config.basePath + "/poplar",
            data: JSON.stringify({source: content, subjectId: subjectId}),
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            success: callback,
            error: onerror
        });
    });

    Files.Show();
    //Files.Show(ChangeCurrentFile);
    //Files.GenerateFTree();
    Output.Prompt();

    Aspen.Debug.SetRunning = (flag: boolean) => {
        if(flag){
            DisableUI();
        }else{
            EnableUI();
        }
    };

    var FindErrorNumbersInErrorMessage = (message: string) => {
        var errorLineNumbers = [];
        jQuery.each(message.split(".c"), (function(k, v){
            var match = v.match(/:(\d+):\d+:\s+error/);
            if(match && match[1]){
                var m = v;
                try {
                    m = v.split("\n")[0].split("error:")[1].trim();
                    if(Aspen.Language == "ja"){
                        m = C2JS.TranslateMessageToJapanese(m);
                    }
                } catch(e) {
                    console.log(e);
                } finally {
                    errorLineNumbers.push({n:match[1], t: m});
                }
            }
        }));
        return errorLineNumbers;
    }

    if($('#file-reset').length > 0) {
        $('#reset-button').show().click(() => {
            if(confirm('この課題を解き始める前の状態に戻します。よろしいですか？')) {
               Editor.SetValue($("#file-reset").text());
            }
        });
    }

    var CompileCallback = (e: Event)=> {
        if(Files.Empty() || running) return;
        if(Editor.ContainsMultiByteSpace()) {
            if(confirm('ソースコード中に全角スペースが含まれています。半角スペースに置換しますか？\n(C言語では全角スペースを使えません)')) {
                Editor.ReplaceMultiByteSpace();
            }
        }
        var src = Editor.GetValue();
        var file = Files.GetCurrent();
        var opt = '-m'; //TODO
        Output.Clear();
        Output.Prompt();
        Output.PrintLn('gcc '+file.GetName()+' -o '+file.GetBaseName());
        DisableUI();
        Editor.RemoveAllErrorLine();

        C2JS.Compile(src, opt, file.GetName(), changeFlag, Context, function(res){
            console.log(changeFlag);
            console.log(res);
            try{
                changeFlag = false;
                if(res == null) {
                    Output.PrintErrorLn('Sorry, the server is something wrong.');
                    return;
                }
                if(res.error.length > 0) {
                    Output.PrintLn(C2JS.FormatClangErrorMessage(res.error, file.GetBaseName()));
                    Editor.SetErrorLines(FindErrorNumbersInErrorMessage(res.error));
                }
                Output.Prompt();

                Context.error = res.error;
                if(!res.error.match("error:")) {
                    Output.PrintLn('./' + file.GetBaseName());
                    C2JS.Run(res.source, Context, Output);
                } else {
                    Context.source = null;
                }
            }finally{
                EnableUI();
            }
        }, ()=>{
            Output.PrintErrorLn('Sorry, the server is something wrong.');
            EnableUI();
        });
    };

    $("#compile").click(CompileCallback);
    (<any>$("#compile")).tooltip({placement: "bottom", html: true});

    var SaveFunction = (e: Event)=> {
        if(Files.Empty()) return;
        var blob = new Blob([Editor.GetValue()], {type: 'text/plain; charset=UTF-8'});
        saveAs(blob, Files.GetCurrent().GetName());
    };
    $("#save-file-menu").click(SaveFunction);


    $("#open-file-menu").click((e: Event)=> {
        $("#file-open-dialog").click();
    });


    $(window).resize(function() {
      var width = $(window).width();
      var sidebarW = $('.sidebar-right').width();
      $('.sidebar-right').css("left", width - sidebarW + "px");
    });

    var RSidebarBtnClickFunction = function() {
      var sbpos = parseInt($(".sidebar-right").css("left").replace(/px/g,""));
      var width = $(window).width();
      if(sbpos === width) {
        $('.sidebar-btn-right').css("opacity", "0.4");
        $('.sidebar-right').css("opacity", "1");
        var sidebarW = parseInt($(".sidebar-right").css("width").replace(/px/g,""));
        $('.sidebar-right').css("left", width - sidebarW + "px");
        $('.demo-editor').css("margin-right", sidebarW + "px");
        $('.btnglyph').css("transform","rotate(180deg)");
      } else {
        $('.sidebar-btn-right').css("opacity", "1");
        $('.sidebar-right').css("left", "100%");
        $('.demo-editor').css("margin-right", "0");
        $('.btnglyph').css("transform","rotate(0deg)");
        $('.sidebar-right').css("opacity", "0");
      }
    };
    if(location.pathname != Config.basePath + "/" && location.pathname != Config.basePath + "/editor") {
      RSidebarBtnClickFunction();
      $(".sidebar-right").css("display", "inline");
      $(".sidebar-btn-right").css("display", "inline");
    }
    $('.sidebar-btn-right').click(RSidebarBtnClickFunction);

    var endsWith = function(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
/*
    $("#file-open-dialog").change(function(e: Event) {
        var file: File = this.files[0];
        if(file) {
            if(!endsWith(file.name, ".c")){
                alert("Unsupported file type.\nplease select '*.c' file.");
                return;
            }
            var reader = new FileReader();
            reader.onerror = (e: Event)=> {
                alert(<any>e);
            };
            reader.onload = (e: Event)=> {
                DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
                var fileModel = new C2JS.FileModel(Files.MakeUniqueName(file.name));
                Files.Append(fileModel, ChangeCurrentFile);
                Files.SetCurrent(fileModel.GetBaseName());
                Editor.SetValue((<any>e.target).result);
                DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
                Editor.ClearHistory();
            };
            reader.readAsText(file, 'utf-8');
        }
    });
*/
    var OnFilesBecomeEmpty = () => {
        $("#delete-file").hide();
        $(".disabled-on-files-empty").addClass("disabled");
        Editor.Clear();
        Editor.Disable();
    };
    var OnFilesBecomeNotEmpty = () => {
        $("#delete-file").show();
        $(".disabled-on-files-empty").removeClass("disabled");
        Editor.Enable();
    };

    /* var CreateFileFunction = (e: any) => {
        if(running) return;
        var path: string;
        if(e.currentTarget.id === "create-file") {
          path = "";
        } else {
          path = Files.Tree.getCurrentPath();
        }
        if(path !== "" && Files.Tree.getCurrentType() == "file"){
          alert("フォルダを選択してください");
          return;
        }
        var pathMassage =path? "\"" + path + "/\"":"";
        var filename = prompt("Please enter the file name." + pathMassage, C2JS.CheckFileName("", DB));
        filename = C2JS.CheckFileName(filename, DB, path);
        if(filename == null) {
            return;
        }
        if(path !== "") {
          Files.Tree.setFile(Files.Tree.getSelectedNode(), filename);
        } else {
          Files.Tree.setFile(Files.Tree.getDefaultNode(), filename);
        }
        var file = new C2JS.FileModel(filename, path);
        Files.Append(file, ChangeCurrentFile);
        Files.SetCurrent(file.GetBaseName());
        OnFilesBecomeNotEmpty();
        Editor.ResetHelloWorld();
        Editor.ClearHistory();
    };
    (<any>$("#create-file")).tooltip({placement: "bottom", html: true});
    $("#create-file").click(CreateFileFunction);
    $("#create-file-menu").click(CreateFileFunction);
    $('#add-file-btn').click(CreateFileFunction);

    var RenameFunction = (e: Event) => {
        if(Files.Empty() || running) return;
        DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
        var oldfilebasename = Files.GetCurrent().GetNoPathName().split(".")[0];
        var oldfilepath = Files.GetCurrent().GetPathArray().join("_");
        var oldfilecontents = Editor.GetValue();

        var filename = prompt("Rename: Please enter the file name.", oldfilebasename);
        filename = C2JS.CheckFileName(filename, DB, oldfilepath);
        if(filename == null) {
            return;
        }
        Files.Rename(oldfilebasename, filename, oldfilecontents, ChangeCurrentFile, DB, oldfilepath);
        Editor.SetValue(oldfilecontents);
        DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
    };
    $("#rename-menu").click(RenameFunction);

    var DeleteFileFunction = (e: Event) => {
        if(Files.Empty() || running) return;
        var BaseName = Files.GetCurrent().GetBaseName();
        if(C2JS.ConfirmToRemove(BaseName)) {
            Files.Remove(BaseName);
            if(Files.Empty()){
                OnFilesBecomeEmpty();
            }else{
                Editor.SetValue(DB.Load(Files.GetCurrent().GetName()));
            }
        }
    };

    (<any>$("#delete-file")).tooltip({placement: "bottom", html: true});
    $("#delete-file").click(DeleteFileFunction);
    $("#delete-file-menu").click(DeleteFileFunction);

    var DeleteAllFilesFunction = (e: Event) => {
        if(Files.Empty() || running) return;
        var BaseName = Files.GetCurrent().GetBaseName();
        if(C2JS.ConfirmAllRemove()) {
            Files.Clear();
        }
        OnFilesBecomeEmpty();
    };
    $("#delete-all-file-menu").click(DeleteAllFilesFunction);
    */
    var JpModeCheckFunction = (function(e: Event) {
        Aspen.Language = this.checked ? "ja" : "en";
    });
    $("#JpModeCheck").click(JpModeCheckFunction);

    document.onkeydown = (ev: KeyboardEvent) => {
        if(ev.ctrlKey) {
            switch(ev.keyCode){
                case 13:/*Enter*/
                    ev.preventDefault();
                    ev.stopPropagation();
                    CompileCallback(ev);
                    return;
//                case 78:/*n*/
//                    ev.preventDefault();
//                    ev.stopPropagation();
//                    CreateFileFunction(ev);
//                    return;
//                case 87:/*w*/
//                    ev.preventDefault();
//                    ev.stopPropagation();
//                    DeleteFileFunction(ev);
//                    return;
//                case 82:/*r*/
//                    ev.preventDefault();
//                    ev.stopPropagation();
//                    RenameFunction(ev);
//                    return;
                case 83:/*s*/
                    ev.preventDefault();
                    ev.stopPropagation();
                    Aspen.Source.Save(Files.GetCurrent().GetName(), Editor.GetValue());
                    return;
//                case 79:/*o*/
//                    ev.preventDefault();
//                    ev.stopPropagation();
//                    $("#file-open-dialog").click();
//                    return;
            }
        }
    };

    $(window).on("beforeunload", (e: Event)=> {
        DB.Save(Files.GetCurrent().GetName(), Editor.GetValue());
    });

    if(DB.Exist(Files.GetCurrent().GetName())) {
        Editor.SetValue(DB.Load(Files.GetCurrent().GetName()));
    } else if($("#file-content").length > 0) {
        Editor.SetValue($("#file-content").text());
    }

    if(_ua.Trident && _ua.ltIE9){
        $("#NotSupportedBrouserAlert").show();
        DisableUI();
    }
});
