#! /usr/bin/env node
import request from 'request-promise'
//parameters url and number of posts to scrap per page
const url = "https://news.ycombinator.com/news?p="
const MaxPostsPerPage = 30
//recover users arguments
const userArgs = process.argv.slice(2)
const command = userArgs[0]
const NbrPosts = Number(userArgs[1])
let Title=[], Uri=[], Author=[], Points=[], Comments=[], Rank=[], nbpost
module.exports = function () {
  //check if command is valid and if the number of posts is a positive integer <= 100
  if (command != "--posts" || Number.isSafeInteger(NbrPosts) === false || NbrPosts<1 || NbrPosts>100) {
    let error = "Invalid command please use hackernews --posts n where n is a positive integer <= 100 "
    console.log(error)
  } else {
    //Base on the number of posts we can calculate the number of pages to scrap (if modulo exist then round it up to add one page)
    const Nbr_pages= (NbrPosts-NbrPosts % MaxPostsPerPage)/MaxPostsPerPage+Math.ceil((NbrPosts % MaxPostsPerPage)/NbrPosts)
    async function main() {
      //loop the required number of pages and get their html body
      for (let i = 1; i <= Nbr_pages; i++) {
        let body = await request(url + i)
        //calculate how many posts we need from the page
        if (i == Nbr_pages) {
          nbpost = (NbrPosts % MaxPostsPerPage)>0 ? NbrPosts % MaxPostsPerPage : MaxPostsPerPage
        } else {
          nbpost = MaxPostsPerPage
        }
        //remove irrelevant table at the top of the page to only recover real post
        body = body.substring(body.indexOf("</tr></table></td></tr>"))
        //Temp variables and write variables
        let PointsOpen, PointsClose, PointsEnd, CommentsOpen, CommentsClose, CommentsEnd,RankOpen, RankClose, RankEnd
        let UriOpen, UriClose, UriEnd,TitleOpen, TitleClose, TitleEnd,AuthorOpen, AuthorClose, AuthorEnd, PostEnd, next, n= 0
        let PointsW, CommentsW, RankW, UriW, TitleW, AuthorW
        //all post have ranking so we use it to delimit posts, could be made in different functions
        while (n < body.split('class="rank', nbpost+1).join('class="rank').length && n>-1) {
          RankOpen = body.indexOf('class="rank',n)
          RankClose = body.indexOf('">',RankOpen)
          RankEnd=body.indexOf('.</span></td>',RankClose+1)
          PointsOpen = body.indexOf('score_',n)
          PointsClose = body.indexOf('">',PointsOpen)
          PointsEnd=body.indexOf(' points<',PointsClose +1)
          CommentsOpen = body.indexOf('| <a href="item?id',n)
          CommentsClose = body.indexOf('">',CommentsOpen)
          CommentsEnd=body.indexOf('</a>',CommentsClose +1)
          UriOpen = body.indexOf('title"><a href=',n)
          UriClose = body.indexOf('="',UriOpen)
          UriEnd=body.indexOf('" class',UriClose +1)
          TitleOpen = body.indexOf('"storylink"',n)
          TitleClose = body.indexOf('">',TitleOpen)
          TitleEnd=body.indexOf('</a>',TitleClose +1)
          AuthorOpen = body.indexOf('user?id',n)
          AuthorClose = body.indexOf('">',AuthorOpen)
          AuthorEnd=body.indexOf('</a>',AuthorClose +1)
          //validate integer for points, comments and rank if missing (occurs after PostEnd) or not integer then use 0
          PostEnd= body.indexOf('class="rank', RankEnd)
          RankW = Number(body.substring(RankClose +2,  RankEnd))
          PointsW = PointsOpen<PostEnd || PostEnd === -1 ? Number(body.substring(PointsClose+2,PointsEnd)):0
          PointsW = Number.isSafeInteger(Number(PointsW)) === true ? Number(PointsW): 0
          CommentsW  = CommentsOpen<PostEnd || PostEnd === -1 ? body.substring(CommentsClose+2,CommentsEnd) : 0
          CommentsW  = CommentsW !== "discuss" && CommentsW !=0 ? CommentsW.substr(0, CommentsW.indexOf('&')) : 0
          CommentsW = Number.isSafeInteger(Number(CommentsW)) === true ? Number(CommentsW): 0
          //validate uri (not sure about exact safety rules) and add https://news.ycombinator.com/ to repost
          UriW= UriOpen<PostEnd || PostEnd === -1 ? body.substring(UriClose+2,UriEnd): "Error_Valid_URI_Required"
          UriW= UriW.includes("item?id=")=== true ? "https://news.ycombinator.com/" + UriW : UriW
          UriW= isURL(UriW)=== true ? UriW : "Error_Valid_URI_Required"
          //validation title and author are non empty strings not longer than 256 characters
          TitleW = TitleOpen<PostEnd || PostEnd === -1 ? body.substring(TitleClose+2,TitleEnd).slice(0, 256) : "Error_Tittle_Required"
          TitleW = TitleW == "" ? "Error_Tittle_Required" : TitleW
          AuthorW = TitleOpen<PostEnd || PostEnd === -1 ? body.substring(AuthorClose+2,AuthorEnd).slice(0, 256) : "Error_Author_Required"
          AuthorW = AuthorW == "" ? "Error_Author_Required" : AuthorW
          //fill arrays
          Points =[...Points, PointsW]
          Rank =[...Rank,RankW]
          Comments =[...Comments,CommentsW]
          Uri =[...Uri,UriW]
          Title =[...Title,TitleW]
          Author =[...Author,AuthorW]
          //move to next post
          n= body.indexOf('class="rank', RankEnd)
        }
      }
      let Output_format= []
      //final build of json output
      for (let i = 0; i < NbrPosts; i++) {
        Output_format.push(new JsonPost(Title[i],Uri[i],Author[i],Points[i],Comments[i],Rank[i]))
      }
      //console.log calls process.stdout.write and stringify with spacing argument display in correct format
      console.log(JSON.stringify(Output_format, null, 2))
    }
    main()
  }
}
//function to create a new post in Json format
function JsonPost (Title,Uri,Author, Points, Comments, Rank ) {
  this.Title = Title
  this.Uri = Uri
  this.Author =Author
  this.Points = Points
  this.Comments = Comments
  this.Rank = Rank
}
//function to check for valid URL
function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i') // fragment locator
  return pattern.test(str)
}
