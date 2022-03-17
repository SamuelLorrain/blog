// @title Simple Playlist Generator
// @date  2019-01-08
// @tags  bash
// @published true
# A shell tour, creating an audio playlist generator

Very present in the community of system and network administrators until the 2000s.
Today, *bash* and *shell* tend to be replaced by other scripting languages like *Python*,
*Go* or *Powershell*.

In my opinion, they still have a lot to offer. Their integration with the OS
and the principle of pipes and standard inputs/outputs
allow to realize programs by simple combination, which makes them languages in their own right.
All syntax elements are accessible both in a script and directly on the command line.

In this article, we will create a simple, but useful audio playlist generator in a few lines.
This will allow us to see the basics of *shell*.

## The propers tools

Before we start, let's ask ourselves some questions:
- How is represented a playlist? Is there a preferred format
format?
- How is my audio player integrated with the command line?

For the first question, it is quite easy to find
that the *m3u* format is standard for playlists. The syntax of
this format is simple: one URL to the file per line.

Example of a valid *m3u* file:
```
~/Document/Music/1.mp3
~/Document/Music/2.mp3
```

2nd question, how does my audio player integrate
to the command line? I will only use VLC here.

Let's do some checks:
```bash
cat playlist.m3u | vlc              # doesn't work
echo "~/Music/1.mp3" | vlc          # doesn't work
vlc playlist.m3u                    # works
vlc ~/Music/1.mp3                   # works
vlc ~/Music/1.mp3 ~/Music/2.mp3     # works
```

It seems that VLC doesn't use the standard input to get the files to be
the files to be played, but you can pass a playlist as an argument, or even
chain several files as argument.

Let's keep this in mind for the following.

## Find my files

Let's assume that the audio files are in this file architecture,
which I guess is quite common for storing music:
```
Music/
├── artist_1/
│   ├── album_1/
│   │   ├── file_1
│   │   ├── file_2
│   │   └── ...
│   ├── album_2/
│   │   ├── file_1
│   │   ├── file_2
│   │   └── ...
│   └── ...
└── artist_2/
│   ├── album_1/
│   │   ├── file_1
│   │   ├── file_2
│   │   └── ...
│   ├── album_2/
│   │   ├── file_1
│   │   ├── file_2
│   └── ...
└── ...
```

Then I can display all the files like this with `find` :
```bash
find Music/ -type f -iregex my_regex
```
`find` is a utility to search for files on the disk.
It takes as first parameter a folder, and searches recursively in it.
It is a rather complex program, with many options and possibilities.

`-type f` allows to display only "normal" files (and thus hides folders, links etc. in the result),

`-iregex` is an option to enter a case insensitive regex for the search.
There is a `-regex` counterpart for a case sensitive regex, I think `-iregex`
is more appropriate here.

A small subtlety is that, even if you specify `type f`, the search will still be performed
on folders, or subfolders. So the argument can be either a song name, an album name
or an artist name. But only files will be returned.

In our case, if we run `find Music/ -type f -iregex "album_1"`, the program returns:
```bash
Music/artist_2/album_1/file_2
Music/artist_2/album_1/file_1
Music/artist_1/album_1/file_2
Music/artist_1/album_1/file_1
```

We can see that the search is performed on albums, and that `find` always returns
the relative path from our `Music/` directory.

## Pipe through VLC

As we saw, VLC does not take into account the standard input.
It is then impossible to pass the result of our `find` as an argument.
The simplest solution is to redirect the output to a
file. Then call vlc with the playlist file as argument.
As we are performing several actions, let's put it all in a script:
```bash
#!/bin/sh
find Musique/ -type f -iregex $1 > playlist.m3u
vlc playlist.m3u
```

And that's it, we just made the shortest playlist generator in the world!

First of all, we can see that each line corresponds to an action.

`#!/bin/sh` indicates that we use the shell interpreter

In *shell* when you refer to a variable, you have to add `$` in front of it,
except at its declaration.

The `$1` is a special variable in *shell* which corresponds to the first
argument entered in the program, so I can run the program like this
like this:
```bash
./audio_playlist '.*Ok Computer.*'
```

The variable `$1` takes the value `.*Ok Computer.*` and I get the corresponding album's playlist.

`>` indicates a redirection. Here the output of `find` will go to the file `playlist.m3u`.
We say that the output of the `find` command is redirected to a file. There are other
types of redirection. You have to keep in mind that `>` will completely override the file
to which we redirect. So be careful.
To redirect to the end of an already existing file, you can use `>>`.

To run the program, you must first allow it to run:
```bash
chmod 755 ./audio_playlist
```

Then run it:
```bash
./audio_playlist
```

## Refining

The program is already working, however, it is far from perfect.
Let's try to improve it a bit.

Since `find` doesn't test the file extension, I can end up with icons, *folder.png* or *albumArt.jpg* files in my playlist,
which is not really what I want. The easiest way to remove them is to filter out all the image files from the find result:

```bash
#...
find Music/ -type f -iregex $1 | awk '! /(png|jpg|jpeg|gif|bmp|ini)$/' > playlist.m3u
#...
```

the `|` character is called a pipe. It allows you to redirect the output of one command to the
the input of another command. It should not be confused with `>`.
We say that we pipe the result of `find` to `awk`.

`awk` is a mini-language operating on strings.
can be complex. But here we have only 2 elements: `/(png|jpg|jpeg|gif|bmp)$/` allows to display only files ending with one of the
only the files ending with one of these strings (it's a regex),
and the `!` in front of it reverses the match of the regex.
So we display the lines only if they don't contain the strings that match
the regex. Here, we explicly say "filter out files with png, jpg, jpeg, gif and bmp extensions";

Another problem to solve. After several tests, I realized that VLC crashes with a too high
number of files. So we will add a maximum number of songs to the playlist thanks to `head` which
only outputs the first x lines of the standard input (I choose 300 arbitrarily):

```bash
#...
find Music/ -type f -iregex $1 | \
    awk '! /(png|jpg|jpeg|gif|bmp|ini)$/' | \
    head -n 300 > playlist.m3u
#...
```

Note the `\` to make the command works
on several lines by escaping the newline character.

## Let's simplify *$1*

Another problem, I noticed that every time I used
the program, I had to put `.*something.*` as an argument.
Indeed, since the search is done on the path of the file and not on the file
itself, the regex must contain this path.
The simplest solution is to add `.*` before and after our argument,
which means "one or more characters" in regular expression.
So we don't have to add this every time. Let's just add this
to the find argument:

```bash
#...
find Music/ -type f -iregex ".*$1.*" |
    awk '! /(png|jpg|jpeg|gif|bmp|ini)$/' | \
    head -n 300 > playlist.m3u
#...
```

The `"` around the regex allows you to easily concatenate the argument with the rest of the string.

The `$1` variable is set to the entered value, and my argument is now
always surrounded by `.*` when I run the program. If no argument is entered
`$1` is equal to an empty string (`""`)
so we don't have to worry about a missing variable problem.

But, does running the program without arguments really make sense?
I'm not sure if it's really necessary to run my whole music folder starting from the beginning.
It would be better to have an error message when I launch the program without argument.
To do this, we will use conditions.

In *shell* and *bash*, conditions have more operators than doesn't exists in
more classical languages. 
There are comparison operators like "true if the variable is an existing file",
"true if the variable is a string with a length greater than 0" etc.

The second one will interest us. Its syntax is `-n`. We can take the
negation of a condition with `!`:
```bash
#!/bin/sh
if [ ! -n "$1" ] #if the string has a length of 0 (empty argument)
then
    echo "You have to give at least one argument to start a playlist"
    exit 1 #exit the program with error code 1
fi
find Musique/ -type f -iregex ".*$1.*" | \
    awk '! /(png|jpg|jpeg|gif|bmp|ini)$/' | \
    head -n 300 > playlist.m3u
vlc playlist.m3u
```

The syntax of *if* looks like Pascal or Ruby on the surface, but has some
specificities. First, in the line `if [ ! -n "$1" ]` the spaces inside
of `[ ]` make sense, without them the condition doesn't work! Also,
you can use ";" to signify an end of statement.
Conditions could't be written in this form:

```bash
if [ ! -n "$1" ];then
    #...
fi
```

Also, *bash*, to remain compatible with *shell* uses a slightly different syntax
instead of having `[ -n $a ]` we have `[[ -n a ]]`. The
syntax with double brackets allows additional conditions.
All conditions available in *shell* also exists in *bash*,
in a backwards-compatibility model.

## Do without a file

Another improvement would be to avoid creating the file *playlist.m3u*.
Indeed, writing a file is a slow operation,
and even polluting in our case because a file will be created
at each execution of the program.
Besides, we only need to create this file
because `vlc` don't use the standard input.

But `vlc` can take file names as arguments as
we have seen. So, we should be able to do something like this:

```bash
#...
playlist=`find Music/ -type f -iregex ".*$1.*" #create a playlist variable
vlc $playlist #runs vlc with the value of playlist
```

However, we will have problems when there are spaces in the result,
because each space is considered as a new argument.

There are several ways to solve this problem, but I propose to chain
`find` to a new program: `xargs`, which is made for this.

`xargs` puts the standard input as an argument.
For example, `ls`, like `vlc` does not use the
as an argument.

```bash
echo "my/folder" | ls # doesn't work
```

then we can write:

```bash
echo "my/folder" | xargs ls
```

and thanks to xargs, the standard input is transformed into a
argument. This is the line that is finally executed:

```bash
ls "my/folder/"
```

In our case, we can rewrite our entire program like this:

```bash
find Music/ -type f -iregex ".*$1.*" | \
    awk '! /(png|jpg|jpeg|gif|bmp|ini)$/' | \
    head -n 300 | xargs vlc
```

We see in the last line, that `head` is piped into xargs and that we don't need the `vlc playlist.m3u` line anymore.

If we test this code, in the end, we have the same problem as with the `$playlist` variable: the spaces
are computed as arguments.
Fortunately `xargs` has a `-d` argument which allows you to choose what will delimit the different
arguments. By default, `find` delimits its output with line breaks.
So we can use the `-d` argument to mean that we want each argument to be separated by a line break.

Here is the complete program:
```bash
#!/bin/sh
if [ ! -n "$1" ];then
    echo "You have to give at least one argument to start a playlist".
    exit 1
fi
find Musique/ -type f -iregex ".*$1.*" | \
    awk '! /(png|jpg|jpeg|gif|bmp|ini)$/' | \
    head -n 300 | xargs -d '\n' vlc
```

## Caching

You may have noticed that `find` is slow. It works by scanning the files one by one
one by one and collects all the files that check the given conditions.

This is annoying, because the larger the number of files, the more files `find`
will have to scan more files, which can slow down our program enormously.

A solution to this is to generate our playlist once, and to
do operations directly on it.
So, instead of scanning all the files, our program scans
only one. The only drawback is that we have to recreate the playlist
each time our `Music/` folder changes,
This seems to me to be a lesser evil.

So let's change our strategy.
We'll generate the playlist file with `find`, but without filtering it:

```bash
find Musique/ -type f | awk '! /(png|jpg|jpeg|gif|bmp|ini)$/' > playlist.m3u
```

The syntax is simpler than before, we remove the `-iregex` option
option and redirect the output to a file. We just have to search
in it to get the files we want.

To do this, we can use `grep` which is a program that
filters a document using a regex.
In our case, we want something like this:

```bash
grep -i ".*$1.*" playlist.m3u
```

the `-i` option indicates that the regular expression is case insensitive,
note also that `grep` can work with the standard input.

We pipe everything together, and we get this:

```bash
#!/bin/sh
if [ "$1" = "-g" ];then
    echo "Generating the playlist file"
    find Music/ -type f | awk '! /(png|jpg|jpeg|gif|bmp|ini)$/' > playlist.m3u
    exit 0
fi

if [ ! -n "$1" ];then
    echo "You have to give at least one argument to launch a playlist"
    exit 1
fi
grep -i ".*$1.*" playlist.m3u | \
    awk '! /(png|jpg|jpeg|gif|bmp|ini)$/' | \
    head -n 300 | xargs -d '\n' vlc
```

I added a condition to generate the playlist file.
`find` will only be executed in case I run the program with
`-g` as argument.

## Shuffle

What if we added a random function to our program? The easiest way,
although not standard (it is not available by default),
is to use the `shuf` utility. It takes the lines from the standard input and permutes them in a
randomly manner:

```bash
grep -i ".*$1.*" playlist.m3u | shuf | \
    head -n 300 | xargs -d '\n' vlc
```

Nothing special, we pipe `shuf`, and voila! We get a shuffle function.

## The complete program

Here is the complete program:

```bash
#!/bin/sh
if [ "$1" = "-g" ];then
   echo "Generating the playlist file"
   find Musique/ -type f > playlist.m3u
    exit 0
fi

if [ ! -n "$1" ];then
    echo "You have to give at least one argument to launch a playlist"
    exit 1
fi
if [ "$1" = "-s" ];then
    grep -i ".*$2.*" playlist.m3u | shuf | \
        head -n 300 | xargs -d '\n' vlc
else
    grep -i ".*$1.*" playlist.m3u | \
        head -n 300 | xargs -d '\n' vlc
fi
```

## Limitations

Of course, there are some problems, for example, if I want to launch
an album, but the song titles don't start with a number, then the ordering
will always be broken, and I can only have all albums of an artist in
alphabetical order. (This program does not use mp3 tags).

Also, if I put `fragile` as an argument, I will end up with
with Yes's Fragile album at the same time as Nine Inch Nails' one,
but also Depeche Mode's Fragile Tension...
There is indeed no distinction between albums, tracks and artists.

One could create regexes to create a
distinction, or use the `cut` utility that splits the standard
input into different fields according to a delimiter (here `/`).

This is a bit beyond the scope of
of an introduction to *shell*. But I hope to have aroused
curiosity about this language.

Here are some resources to learn *shell* and *Bash*:

- A basic, complete tutorial: [http://tldp.org/HOWTO/Bash-Prog-Intro-HOWTO.html](http://tldp.org/HOWTO/Bash-Prog-Intro-HOWTO.html)
- Another more advanced tutorial : [http://tldp.org/LDP/abs/html/index.html](http://tldp.org/LDP/abs/html/index.html)
- Another advanced tutorial, quite a lot of little tricks : [http://www.grymoire.com/Unix/Sh.html](http://www.grymoire.com/Unix/Sh.html)
- The documentation of *Bash*: [https://www.gnu.org/software/bash/manual/bashref.html](https://www.gnu.org/software/bash/manual/bashref.html)

