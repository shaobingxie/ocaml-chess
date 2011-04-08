// AJAX request object
var xhr = null;

// Board object
function Board(toMove)
{
    this.pieces = new Array();
    for(var i = 0; i < 8; i++)
    {
        this.pieces[i] = new Array();
    }
    
    this.toMove = toMove;
    
    this.pieceAt = function(rank, file)
    {
        return this.pieces[rank][file];
    }
    
    this.insert = function(rank, file, piece)
    {
        this.pieces[rank][file] = piece;
    }
}

// display a board
function loadBoard(b)
{
    var boardView = document.getElementById("board");
    
    var html = "";
    for(var rank = 7; rank >= 0; rank--)
    {
        html += "<tr id='rank_" + (rank + 1) + "'>";
        
        for(var file = 0; file < 8; file++)
        {
            // set up the chessboard pattern
            var fileName = String.fromCharCode(65 + file);
            var background = ((file % 2) ^ (rank % 2))? "white" : "#05A";
            var color = (background === "#05A")? "white" : "#05A";
            var id = fileName + (rank + 1);
            
            html += "<td class='file_" + fileName + "' id='" + id +
                    "' style='background-color: " + background +
                    "; color: " + color + ";'>";
            
            html += "<div class='piece' draggable=true>";
            
            // insert the proper piece into each square
            if(b != null && b.pieceAt(rank, file) != null)
            {
                var piece = b.pieceAt(rank, file);
                html += "<div class='piece." + piece +
                        "' style=\"background-position: center;" +
                        "background-image: url('images/" + piece +
                        ".png'); height: 45px; width: 45px;\"></div>";
            }
            
            html += "</div></td>";
        }
        
        html += "</tr>";
    }
    
    boardView.innerHTML = html;
}

/* Parse a board encoded in Forsyth-Edwards notation
 * into a Board object.  See
 * http://en.wikipedia.org/wiki/Forsyth�Edwards_Notation
 */
function parseFEN(str)
{
    // first figure out which player is to move
    var split1 = str.split(" ");
    var toMove = split1[1];
    var board = new Board(toMove);
    
    // then parse the piece positions
    var split2 = split1[0].split("/");
    for(var i in split2)
    {
        var rank = 7 - i;
        function parseRank(rem, file)
        {
            // if we have reached the end of the rank, return
            if(rem === "" || file >= 8)
                return;
            
            // if next char is a number, skip that number of squares
            var code = rem.charCodeAt(0);
            if(code >= 48 && code < 58)
                return parseRank(rem.substr(1), file + (code - 48));
                
            var p = String.fromCharCode(code);
            var color = (p.toLowerCase() === p)? "b" : "w";
            
            function fullName(letter)
            {
                switch(letter)
                {
                    case "p": return "pawn";
                    case "n": return "knight";
                    case "b": return "bishop";
                    case "r": return "rook";
                    case "q": return "queen";
                    case "k": return "king";
                }
            }
            
            var piece = color + fullName(p.toLowerCase());
            board.insert(rank, file, piece);
            
            return parseRank(rem.substr(1), file + 1);
        }
        
        parseRank(split2[i], 0);
    }
    return board;
}

function initBoard()
{
    loadBoard(parseFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w"));
}

// Send a request to the server via AJAX
function sendAJAX(params, callback)
{
    // initialize XHR
    try
    {
        xhr = new XMLHttpRequest();
    }
    catch (e)
    {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }
    
    if (xhr == null)
    {
        alert("Error: Your browser is not configured to support AJAX!");
        return;
    }
    
    // initialize callback function
    function genericAJAXHandler(f)
    {
        return function()
        {
            // only handle loaded requests
            if (xhr.readyState == 4)
            {
                if (xhr.status == 200)
                {
                    f(xhr.responseText)
                }
            }
            return;
        };
    }
    
    xhr.onreadystatechange = genericAJAXHandler(callback);
    
    xhr.open("POST", "index.html", async);
    
    // set HTTP headers (adapted from http://www.openjs.com/articles/ajax_xmlhttp_using_post.php)
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("Content-length", params.length);
    xhr.setRequestHeader("Connection", "close");
    
    // send form via POST
    xhr.send(params);
    return;
}

function handleBoard(response)
{
    var boardFEN = xhr.response;
    var board = parseFEN(boardFEN);
    loadBoard(board);
}

/* Submit a move to the server via AJAX.
 * Returns false if invalid else a new board.
 */
function submitMove(move)
{
    function moveCallback(response)
    {
        /* response is either "false," indicating invalid move,
         * or a new Board
         */
        if(response !== "false")
        {
            handleBoard(response);
        }
    }
    
    sendAJAX("request=makemove&value=" + move, moveCallback);
    return;
}

/* Request the board from the server.
 * If the server is to move, causes the
 * server to make its move.
 */
function requestBoard()
{
    sendAJAX("request=board", handleBoard);
}