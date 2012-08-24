{
    var exprjoin = function(e) {
        if (e[1].length === 1) {
            return e[1][0];
        }
        console.log(e);
        var result = [e[1][0]];
        var second = [];
        for (var i = 1; i < e[1].length; ++i) {
            Array.prototype.push.apply(result, e[1][i][0]);
        }
        return (result.length === 1 ? result[0] : result);
    };
}

// Parser for limited SQL expressions. Derived from sqld3

start = expr

whitespace = [ \t\n\r]*
whitespace1 = [ \t\n\r]+

E = "E"
dot = '.'
comma = ','
minus = '-'
plus = '+'
lparen = '('
rparen = ')'
digit = [0-9]
decimal_point = dot
equal = '='
star = '*'

name = 
        ( str: (([A-Za-z]) ([A-Za-z0-9_]*)) {return str[0] + str[1]}) 
        / ( str: (('"') ([^"]+) ('"')) {return str[1] } )

table_name = name
column_name = name
function_name = name
collation_name = name
database_name = name
type_name =
  ( name )+
  ( ( lparen signed_number rparen )
  / ( lparen signed_number comma signed_number rparen ) )?

CURRENT_TIME = 'now'
CURRENT_DATE = 'now'
CURRENT_TIMESTAMP = 'now'

bind_parameter = '?'

NULL = whitespace1 "NULL"
AND = whitespace1 "AND"
CAST = whitespace1 "CAST"
DISTINCT = whitespace1 "DISTINCT"
AS = whitespace1 "AS"
NOT = whitespace1 "NOT"
CASE = whitespace1 "CASE"
ELSE = whitespace1 "ELSE"
END = whitespace1 "END"
WHEN = whitespace1 "WHEN"
THEN = whitespace1 "THEN"
COLLATE = whitespace1 "COLLATE"
LIKE = whitespace1 "LIKE"
GLOB = whitespace1 "GLOB"
REGEXP = whitespace1 "REGEXP"
MATCH = whitespace1 "MATCH"
ESCAPE = whitespace1 "ESCAPE"
ISNULL = whitespace1 "ISNULL"
NOTNULL = whitespace1 "NOTNULL"
IS = whitespace1 "IS"
BETWEEN = whitespace1 "BETWEEN"
IN = whitespace1 "IN"

numeric_literal =
  digits:( ( ( ( digit )+ ( decimal_point ( digit )+ )? )
           / ( decimal_point ( digit )+ ) )
           ( E ( plus / minus )? ( digit )+ )? )
  { var x = flatstr(digits);
    if (x.indexOf('.') >= 0) {
      return parseFloat(x);
    }
    return parseInt(x);
  }

string_literal = "'" [^']* "'"

signed_number =
  ( ( plus / minus )? numeric_literal )

literal_value =
  ( numeric_literal / string_literal / NULL / CURRENT_TIME / CURRENT_DATE / CURRENT_TIMESTAMP )

unary_operator =
  x: ( whitespace
       ( '-' / '+' / '~' / 'NOT') )
  { return x[1] }


call_function =
  ( function_name
    whitespace lparen
               ( ( DISTINCT ? ( expr (whitespace comma expr)* )+ )
               / whitespace star )?
    whitespace rparen )

value =
  v: ( whitespace
       ( ( x: literal_value
           { return { literal: x } } )
       / ( b: bind_parameter
           { return { bind: b } } )
       / ( d: ( database_name dot table_name dot column_name )
           { return { column: t[3], table: t[2], database: t[1] } } )
       / ( t: ( table_name dot column_name )
           { return { column: t[2], table: t[1] } } )
       / ( c: column_name
           { return { column: c } } )
       / ( unary_operator expr )
       / call_function
       / ( p: ( lparen expr whitespace rparen )
           { return {braced : p[1]} } )
       / ( CAST lparen expr AS type_name rparen )
       / ( CASE expr ? ( WHEN expr THEN expr )+ ( ELSE expr )? END ) ) )
  { return v[1] }

expr1 =
    e: ( whitespace
        ( value (
            i: (whitespace ('*' / '/' / '%') value ) { return [i[1], i[2]] }
        )* ) )
  { return exprjoin(e) }

expr2 =
    e: ( whitespace
        ( expr1 (
            i: (whitespace ('+' / '-') expr1 ) { return [i[1], i[2]] }
        )* ) )
  { return  exprjoin(e) }

expr3 =
    e: ( whitespace
        ( expr2 (
            i: (whitespace ('<<' / '>>' / '&' / '|') expr2 ) { return [i[1], i[2]] }
        )* ) )
  { return  exprjoin(e) }

expr4 =
    e: ( whitespace
        ( expr3 (
            i: (whitespace ('<=' / '>=' / '<' / '>' / '=' / '==' / '!=' / '<>') expr3 ) { return [i[1], i[2]] }
        )* ) )
  { return  exprjoin(e) }

expr5 = 
    e: ( whitespace
        ( expr4 (
            i: (whitespace ('OR' / 'AND' / '||' / '&&') expr4 ) { return [i[1], i[2]] }
        )* ) )
  { return  exprjoin(e) }

expr =
  e: ( whitespace
       ( ( expr5 COLLATE collation_name )
       / ( expr5 NOT ? ( LIKE / GLOB / REGEXP / MATCH ) expr ( ESCAPE expr )? )
       / ( expr5 ( ISNULL / NOTNULL / ( IS ? NOT NULL ) ) )
       / ( expr5 NOT ? BETWEEN expr AND expr )
       / ( expr5 NOT ? IN ( lparen ( expr comma )+ rparen )
       / expr5 ) ) )
  { return e[1]; }
