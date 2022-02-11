// @title Rogue Random Generator
// @date  2022-01-25
// @tags random, oldies, nethack, C
// @published true
## Introduction

Rogue is a game released in 1980. It puts us in the shoes of an adventurer who must go through a dungeon to find an amulet.
It is the famous ancestor of rogueslikes. Given its release date, we do not find any graphics.
Our character is represented by the character *@* in a terminal.

In Rogue, many elements are randomly generated,
and that's where the game gets its interest. In each game, the map is different, and of course the encounters with enemies are different too.
More original, the adventurer who arrives in this dungeon doesn't know which object produces which effect:
This red potion could very well heal him or make him sleep.
And in each game, the names of the objects are randomly changed.
So a big part of the game is figuring out how to identify the items,
a mechanism that will become even more important in _Nethack_, an improved Rogue clone still being developed today,
and in variants of it (_SLASH'EM_, _Unethack_ and so on).

Who says random, says pseudo-random number generator.
The purpose of this article is to analyze this generator and how it is used.

We will use the code of Rogue present on the [NetBSD repository of github](https://github.com/IIJ-NetBSD/netbsd-src).
A version of Rogue rated 5.3 or "rogue-clone: Version III"

## A little compilation hiccup

After starting to analyze the code, I realized that it was not compilable as is
because *NetBSD* defines non-standard macros,
and we end up with `__dead`, `__printflike(x,y)` and other `_RCSID(arg)`.
These macros are defined in `sys/cdefs.h` of *NetBSD* and allow some optimizations or versioning.

Anyway, to make the compilation work, I added this at the beginning of the `rogue.h` file
to replace non-standard macros and functions:

```C
#define __dead
#define __printflike(fmtarg, firstvararg)
#define __unused
#define __unreachable()
#define strlcpy strncpy
#define strlcat strncat
#define fpurge __fpurge
```


Also, here is a working makefile on linux:

```Makefile
PROG= rogue
SRCS= hit.c init.c inventory.c level.c machdep.c main.c
	message.c monster.c move.c object.c pack.c play.c random.c ring.c
	room.c save.c score.c spec_hit.c throw.c trap.c use.c zap.c

${PROG} : ${SRCS}
	gcc ${SRCS} -o ${PROG} -Dlint -DUNIX -DUNIX_SYSV -lcurses
```

Note that Rogue does not seem to work on *Tilix* and other terminals using *VTE GTK3*, but does work on *urxvt*, *xterm* etc.

## Using randomization in object initialization

It was while reading the initialization function (`init()`)
that a curiosity made me want to write this article.
Indeed, the randomization of the name of the objects is done in 3 steps, in 3 different functions.

It's curious, because there are 4 kinds of randomized objects (potions, scrolls, wands, rings)
that work the same way in the game at first sight.

In the function `init()` we have:

```C
/*...*/
mix_colors();                  // randomize potions
get_wand_and_ring_materials(); // randomize wands and rings
make_scrolls_title();          //randomize scrolls
/*...*/
```

Object types are stored in arrays of `struct id`:

```C
struct id {
	short value;                  // the value of the object (to sell or buy it)
	char title[MAX_ID_TITLE_LEN]; // the title, the randomized value we are interested in here
	const char *real;             // the real effect of the object :
                                  //   ("of healing", "of teleportation")
	unsigned short id_status;     // is the object not identified (0),
                                  //   identified (1), named by the player (2)
};
```

## Mix_Colors()

```C
void mix_colors(void){
	short i, j, k;
	char t[MAX_ID_TITLE_LEN];

	for (i = 0; i <= 32; i++) {
		j = get_rand(0, (POTIONS - 1)); //get_rand(a,b) returns a number
                                            //random between a and b inclusive
		k = get_rand(0, (POTIONS - 1));
		strlcpy(t, id_potions[j].title, sizeof(t));
		strlcpy(id_potions[j].title, id_potions[k].title,
			sizeof(id_potions[j].title));
		strlcpy(id_potions[k].title, t, sizeof(id_potions[k].title));
	}
}
```

The function is very simple, it takes 2 *title* elements from the potions array,
and swaps them 32 times using a swap algorithm.
So there is a chance that some potions will keep their original title, because the function will have swapped the same elements several times.
But it is also possible that the swap is done between the same two elements and therefore have no effect.
We can then consider that the function is imperfect.

## Get\_wand\_and\_ring\_materials()

```C
void get_wand_and_ring_materials(void) {
	short i, j;
	boolean used[WAND_MATERIALS];

	for (i = 0; i < WAND_MATERIALS; i++) {
		used[i] = 0;
	}
	for (i = 0; i < WANDS; i++) {
		do {
			j = get_rand(0, WAND_MATERIALS-1);
		} while (used[j]);
		used[j] = 1;
		(void)strlcpy(id_wands[i].title, wand_materials[j],
			       sizeof(id_wands[i].title));
		is_wood[i] = (j > MAX_METAL);
	}
    /*...*/
}
```

Here, the initialization is done in 2 steps.
There is no reason to combine the initialization of wands and rings, as far as we can see here.
The function uses the boolean array `used[]` to avoid the pitfall of the `mix_color()` function.

Everything happens in the loop. `used[]` is initialized to 0 for all its cells.
Then, we enter the for loop, and randomly search the `used[]` array for a cell at 0 (false).
We set this cell to 1 (true), and, according to the index `j` of the cell, we assign a name to the wand.

With this technique, it is no longer possible to swap the same wand several times,
and all names are assigned randomly.
But unlike the `mix_color()` function, you have to call `get_rand()` several times to get an empty cell in the `used[]` array.
The initalization of the rings is done in the same way in the rest of the function.

## Make\_scrolls\_title()

```C
void make_scroll_titles(void) {
	short i, j, n;
	short sylls, s;
	size_t maxlen = sizeof(id_scrolls[0].title);

	for (i = 0; i < SCROLS; i++) {
		sylls = get_rand(2, 5);
        /*...*/

		for (j = 0; j < sylls; j++) {
			s = get_rand(1, (MAXSYLLABLES-1));
			(void)strlcat(id_scrolls[i].title,syllables[s],
					maxlen);
		}
        /*...*/
	}
}
```

This function is also different, because instead of picking from pre-existing names,
it uses a dictionary of syllables to randomly generate scroll names.
Each scroll can be from 2 to 5 syllables long, and since there is no verification,
multiple scrolls can have the same name.

## Analysis of the random functions

The randomizer is very similar to the `srandom_unlocked()` and `random_unlocked()` functions in the *libc* of *Netbsd*.

It consists of two functions `srrandom(int)` and `rrandom()`, and the following variables:

```C
static long rntb[32] = {
	         3, 0x9a319039, 0x32d9c024, 0x9b663182, 0x5da1f342,
	0xde3b81e0, 0xdf0a6fb5, 0xf103bc02, 0x48f340fb, 0x7449e56b,
	0xbeb1dbb0, 0xab5c5918, 0x946554fd, 0x8c2e680f, 0xeb3d799f,
	0xb11ee0b7, 0x2d436b86, 0xda672e2a, 0x1588ca88, 0xe369735d,
	0x904f35f7, 0xd7158fd6, 0x6fa6f051, 0x616e6b96, 0xac94efdc,
	0x36413f93, 0xc622c298, 0xf5a42ab8, 0x8a88d77b, 0xf5ad9d0e,
	0x8999220b, 0x27fb47b9
};

static long *fptr = &rntb[4];
static long *rptr = &rntb[1];
static long *state = &rntb[1];
static int rand_type = 3;
static int rand_deg = 31;
static int rand_sep = 3;
static long *end_ptr = &rntb[32];
```

A first thing that is interesting here is `rntb[0]` which is equal to 3.
Some implementations of this function (glibc, libc etc.) use this first cell of the array instead of a `rand_type` variable.
And we will see later that the first cell of the array is never used in the algorithm.

This `rand_type` variable is in fact equal to *3*.
This refers to a particular type of randomness.
There are 2 available in the source code: 0 or 3.

Type 0 is a [linear congruential generator](https://en.wikipedia.org/wiki/Linear_congruential_generator) or *GCL*.
It is a function that does not involve the variables we have already seen,
but a rather simple calculation: `random_number = state[0] = (state[0]*1103515245 + 12345) & 0x7fffffff`,
which uses the `state` variable to return a different result on each call.
The `& 0x7fffffff` is equal to the maximum value that a signed 32-bit number can take,
so the function can't return a negative number.

By default, type 3 is used.
One can imagine that on a machine with little memory
we can use type 0 to save the space of an array of 32 int,
and the execution of some instructions.

Rogue's pseudorandom generator uses a seed function and a function to obtain a new number.

Let's first look at the seed function `srrandom(int)`, cleaned up of type 0 instructions:

```C
void srrandom(int x) {
	int i;
	state[0] = x;

    for (i = 1; i < rand_deg; i++) {
        state[i] = 1103515245 * state[i - 1] + 12345;
    }
    fptr = &state[rand_sep];
    rptr = &state[0];
    for (i = 0; i < 10 * rand_deg; i++) {
        (void)rrandom();
    }
}
```

The seed, represented by `x` is assigned to `state[0]`, which corresponds to the 2nd cell of the array.
Because `state` is a pointer to the 2nd cell of `rntb`.
We find in the first `for` our famous *GCL*: It is used here to salt the seed according to the `rand_deg` variable.

Then, the values of the two pointers `fptr` for "front pointer" and `rptr` for "rear pointer",
are set to particular addresses in the array.
We will see that the array will serve as a state machine for the generator,
and that it is these variables which will modify the state.

Finally, a second `for` loop will call the `rrandom` function, `10*rand_deg` times.
This, as in the other loop, is a way to make it a little more difficult to predict the state of the generator.

Then comes the `rrandom` function

```C
static long rrandom(void) {
	long i;

    *fptr += *rptr;
    i = (*fptr >> 1) & 0x7fffffff;
    fptr++;
    if (fptr >= end_ptr) {
        fptr = state;
        rptr++;
    } else {
        rptr++;
        if (rptr >= end_ptr) {
            rptr = state;
        }
    }
	return(i);
}
```

This function is the heart of the generator. `fptr` and `rptr` point to two cells of the array.
We will modify the value at `fptr` by adding the one at `rptr`. We store this value in a variable `i` (modulo 32 bits signed)
which we return at the end of the function,
and we move the two pointers to the next cell of the array with respect to their respective positions,
or to the beginning of the array if we are at the end.

As the array `rnbt[32]` is initialized with default values that are already quite hazardous,
we get numbers which are difficult to predict, and,
as the value of the array at `fptr` is modified at each call of the function
(on the line `*fptr += *rptr;`), we get a rather interesting generator.

## Use in the code

The `rrandom()` function is not used directly,
it goes through a function `get_rand(int x, int y)` which has two features:
firstly to circumscribe the result between `x` and `y`,
but also to restrict the result in 16 bits thanks to `lr &= 0x3fff`

We note the presence of a function `coin_toss()` which returns randomly 0 or 1
and is used on several occasions, whether it is the generation of a dungeon,
or the triggering of certain events and even for the use of objects.

The seed is initialized in the `init()` function of rogue,
by fetching the *timestamp* with a standard call.

## Conclusion

We have seen how a simple but sufficient pseudo random generation algorithm works,
good enough to have been present in both a video game and a widely used OS.

Moreover, the *libc* uses today a [similar](https://github.com/bminor/glibc/blob/master/stdlib/random.c) implementation.

