# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: static HTML/CSS/vanilla JS served by GitHub Pages, no build step. The owner allowed a framework; it was kept static because the app is a single page with no routing and a build step would add deploy friction without user benefit.

## Users

- Players checking their own Duel Commander deck before a tournament, league or casual game, on phone or desktop.
- Organizers and judges checking decklists submitted by several players.

Both use it equally.

## Product Purpose

Paste a decklist (LigaMagic, Moxfield, Archidekt or plain text), optionally pick the commander, and get a clear legal/illegal verdict against the official Duel Commander banlist, then inspect the deck in list or grid view. Success: the visitor knows in seconds whether the deck is legal and exactly which cards are the problem.

## Positioning

Built around the Duel Commander (French 1v1 Commander) banlist, including cards banned only as commander, and around LigaMagic exports, which place the commander inside the 100-card list and use Portuguese card names.

## Operating Context

- Lists are copied from LigaMagic, Moxfield, Archidekt or typed by hand; some names come in Portuguese and are translated.
- Card data and images come from the public Scryfall API (collection, named and autocomplete endpoints), cached in localStorage.
- Banlist lives in `js/banlist.js` with a manual `updatedAt` date.

## Capabilities and Constraints

- Commander field with Scryfall autocomplete and preview; optional when the list has a Commander section.
- Deck structure validation (99 + 1 = 100, singleton, etc.), banlist checks (banned in deck, banned as commander), unknown-card detection.
- Result: verdict, totals, problem list, commander result, card list.
- Card viewing in list or grid; grid groups cards by type.
- Light and dark appearance, switchable by the visitor.
- Ctrl+Enter shortcut validates.
- Interface language: Brazilian Portuguese.

## Brand Commitments

- Name: "Duel Commander Validator" / "Duel Commander Deck Validator".
- Owner direction: visual language inspired by apple.com, with light/dark toggle.
- Not affiliated with Wizards of the Coast; card data credited to Scryfall.

## Evidence on Hand

No testimonials, usage numbers or press. Do not invent any.

## Product Principles

1. The verdict comes first; details support it.
2. Every problem names the card and the reason.
3. Paste-and-go: no account, no setup, works on a phone.
4. Banlist accuracy outranks features.
