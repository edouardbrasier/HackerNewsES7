# ES7 HackerNews scraper

It is an attempt to write a https://news.ycombinator.com/news web scraper using node with ES7
in order to benefit from new syntax such as asynch/await and avoid callbacks.

It is also my first command line tool, it takes a few seconds not because of the code but because of babel transpiling.

I only imported request, request-promise in order to get the html body, I have used vanilla ES7 javascript to scrap the html body

Prerequisites = Node, NPM, Git

How to install?

```sh
$ git clone https://github.com/edouardbrasier/HackerNewsES7.git
$ cd hackernewsES7
$ npm install
$ npm link
```

How to use to get n posts?

```sh
$ hackernews --posts 32
```

