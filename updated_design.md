# workflow

This workflow is aimed to replace the r-science workflow. It is generalisable and will have multiple differing manifestations. R-Science will be one manifestation (with particular tools and desiderta) but the high level design shouldn't be tied to R-Science in particular. It may also be for creating quite different things like a complex management plan (in which case the idea of testing and benchmarking changes, but the general concept I think, stays the same).

The workflow spans three separate conversations (context windows) that share a scratchpad, the repo, and the GitHub issues. **UserA, UserB and UserC are the same person** — shown separately to emphasise that each conversation only sees the text written into it. The source of truth within a conversation, is the conversation itself. The source of truth between conversations during the same session is the scratchpad (Claude Code has some built in system for this? How does it work? Are there any important details?) Github issues is the source of truth between sessions. They are structured summaries of what was previously done - the state of thinking BEFORE the current session.

This document splits the workflow into an **overview** plus one diagram per phase, so each fits on a screen and can grow independently. The implementation phase is split further into its own sub-steps.

The workflow models a very un-agile system. I would like to modify it to make it more agile.

## Thoughts:

### Make stages/components/tasks first class citizens.

There is a fractal nature to what we were discussing in issue #16. We had a workflow where the package starts as idea (issue #1) which then spawns issues #2-n which each then spawn sub-issues #n-m which then each spawn a plan with stages 1-n which each then have task 1-n. The general process potentially works at each level (though by the time you get to individual tasks, you probably don't want to be whiteboarding them - Though sometime you might want to...). How they differ is by how certain that they are the correct thing to do (is that actually the correct description of the axis?). When we aren't sure what we are meant to be doing we need to whiteboard it until we have something that hangs together.

Let's refer to this fractal general class of semi-heirarchical things as components

### Stability

pre-alpha: a vague idea
alpha: API, but no load bearing internal content
beta: API, plus mocked up/approximate internal content
v1: API, MVP correct internal content - tested and optimised
v2..n: API, Expanded correct internal content - tested and optimised

Each component gets given a version number. This is independent of the version of the finished artefact as a whole. 

### Cost/reliability ladder

Creating a v1 (let alone vN) component is costly. However, once you have made it you are fairly certain that it is (locally) the correct thing (it does what it says on the box). However, without having built all the other things, you can't know if it is also globally the correct thing (did we actually want that sort of thing?)

Cost curve: From cheapest, but least reliable to most expensive but most reliable we have:
- Reasoning (thought experiments)
- Research (other people's existing experiments - different to your situation, but useful)
- prototypes
- actual implementation

Note: this is approximate and 

So the way to test our top level idea is to build the whole thing. But we don't want to build the whole thing and then realise that we built the wrong thing. Instead we want to find out we are doing something wrong as early as possible (fail early, fail often). So getting one component to v1 (or worse vN) before starting on the next one is the wrong approach.

# Idea 1
- pad out along the cost curve at the same rate across the entire project

# Idea 2
- Assign confidence and centrality to differnt components and really work thru those before working thru others. 
    - If an edge bit is wrong we can probably re-design it without redesigning the whole project. If a central bit is wrong, we need to re-design everything.
    - We probably don't need to worry too much about investigating the assumption that the earth goes around the sun. We DO need to spend time figuring out if our non-standard statistical technique actually works with our data.
    - The confidence and centrality are two seperate issues, but they interact.

### Divergent/Convergent thinking

At first I thought that the distinction between whiteboarding and planning was divergent vs convergent thinking. But I'm not sure that is true (maybe it is). It feels like it might be an issue of specificity instead. I'm not really sure.

Anyway, there are algorthms for choosing the ideal mixture of exploration vs exploitation. We should think how this could link in.

If a single leaf has an issue, that doesn't mean the central thesis is wrong, but if multiple different leaves all are having the similar issues, then it is time to rethink the central thesis. 

### Synthesis

We at least need to have a path from whiteboard that isn't "plan -> implement -> test -> optimiste -> validate". It is more like "Create components at pre-alpha or alpha stage, which will themselves be whiteboarded". Similarly, plan should be able to say: something like "Here are the stages:

1. Routine - we know we can make it work. We know how it will work with other components. Just leave at pre-alpha (what the plan produces)
2. Hard, but doable - let's make a beta version now so we can see how it hangs together with the rest. 
3. Routine - pre-alpha
4. Under-specified and big - this needs to be sent to its own whiteboard/planning process to break into sub-components
...
n. laod-bearing - we really need to know that this piece works and works properly. Let's build it to v1 now."

In fact maybe that is the difference between plan and whiteboard, plan creates and ranks components and then sends them to different plances (whiteboarding, implementation, etc)? I don't know. I'm not convinced that whiteboard and plan are actually the correct ideas.

---

## Overview

```mermaid
---
title: Overview — r-science workflow
config:
  sequence:
    useMaxWidth: false
    wrap: true
    actorFontSize: 18
    messageFontSize: 15
    noteFontSize: 14
    actorMargin: 60
    messageMargin: 30
    mirrorActors: true
    showSequenceNumbers: true
---
sequenceDiagram
    box Whiteboard conversation
        participant UserA
        participant Whiteboard
    end
    box Planning conversation
        participant UserB
        participant Planner
    end
    box Implementation conversation
        participant UserC
        participant Orchestrator
    end
    participant SubAgents
    participant Scratchpad
    participant Repo
    participant GH as gh-issues

    Note over UserA,Orchestrator: UserA / UserB / UserC are the same person in three separate conversations. Per-phase detail is in the diagrams below.

    UserA->>Whiteboard: Idea (/whiteboard issue #1)
    loop Phase 1 — Brief (see Whiteboard diagram)
        UserA<<->>Whiteboard: Draft / review / refine
    end
    Whiteboard->>Scratchpad: Approved design brief
    Whiteboard->>UserA: Switch to the planner conversation

    UserB->>Planner: Begin planning
    loop Phase 2 — Plan (see Planning diagram)
        UserB<<->>Planner: Draft / review / refine (may query Whiteboard)
    end
    Planner->>Scratchpad: Approved implementation plan
    Planner->>UserB: Switch to the orchestrator conversation

    UserC->>Orchestrator: Begin implementation
    Note over Orchestrator,Repo: Phase 3 — Implementation (see sub-diagrams 3a–3d)
    Orchestrator->>SubAgents: Create tests, then benchmarks, then capture baseline
    Orchestrator->>SubAgents: Implement staged tasks (debug / plan-mod loop)
    Orchestrator->>Repo: Commit and push per stage
    Orchestrator->>SubAgents: Optimise performance, then verify
    Orchestrator->>UserC: Final report + sign-off
    Orchestrator->>GH: Close design / plan / notebook issues
    Orchestrator->>Repo: PR + merge
    Orchestrator->>UserC: All done
```

---

## PLAN-MOD subprocess

Referenced by the implementation diagrams (3a–3c) whenever a downstream agent finds the plan is unclear or wrong.

```mermaid
---
title: PLAN-MOD subprocess
config:
  sequence:
    useMaxWidth: false
    wrap: true
    actorFontSize: 18
    messageFontSize: 15
    noteFontSize: 14
    actorMargin: 60
    messageMargin: 30
    mirrorActors: true
    showSequenceNumbers: true
---
sequenceDiagram
    box Planning conversation
        participant UserB
        participant Planner
    end
    box Implementation conversation
        participant Orchestrator
        participant UserC
    end
    participant SubAgents
    participant Scratchpad

    Note over SubAgents,Planner: Triggered whenever a downstream agent finds the plan is unclear or wrong
    SubAgents->>Planner: [Agent] Plan has problems x, y, z
    alt minor issues
        Note over Planner: Issues count as minor iff they are clearly decidable from the previous turns in the planning conversation. Examples - typos, ambiguous wording in plan, things agreed to in conversation that should have been added to plan but weren't (Must have been agreed to, not merely mentioned), things that logically follow from what was agreed to.
        Planner->>Scratchpad: Replace plan
        Planner->>UserB: Inform user of changes (seen if they switch back)
        Planner-->>Orchestrator: Inform user of the following changes "foo"
        Orchestrator->>UserC: Changes "foo" made to plan
        Planner-->>SubAgents: [Agent] Plan fixed — redo affected work
    else major issues
        Planner-->>Orchestrator: Tell user to return to the planning conversation
        Orchestrator->>UserC: Return to the planning conversation (re-enter Phase 2)
    end
```

---

## Phase 1 — Whiteboard (design brief)

```mermaid
---
title: Phase 1 — Whiteboard (design brief)
config:
  sequence:
    useMaxWidth: false
    wrap: true
    actorFontSize: 18
    messageFontSize: 15
    noteFontSize: 14
    actorMargin: 60
    messageMargin: 30
    mirrorActors: true
    showSequenceNumbers: true
---
sequenceDiagram
    box Whiteboard conversation
        participant UserA
        participant Whiteboard
    end
    participant SubAgents
    participant Scratchpad

    UserA->>Whiteboard: Initial idea (/whiteboard issue #1)
    loop Until brief signed off and review-clean
        UserA<<->>Whiteboard: Conversation to create / refine design brief
        Whiteboard->>SubAgents: [Scout — lesser model] "Go find out x, y and z"
        SubAgents-->>Whiteboard: Findings
        Whiteboard->>UserA: Draft for sign-off
        alt UserA rejects
            UserA->>Whiteboard: Rejected — keep refining
        else UserA signs off
            UserA->>Whiteboard: Sign off
            Whiteboard->>Scratchpad: Save design brief
            Whiteboard->>SubAgents: [Brief reviewer] "Review the brief. Sufficient to create a plan? In conflict with other briefs / instructions?"
            alt Reviewer — looks good
                SubAgents-->>Whiteboard: [Brief reviewer] Looks good — proceed
                Note over Whiteboard: Brief approved — exit loop
            else Reviewer — minor issues
                Note over Whiteboard: Typo / unclear wording, OR already answered in conversation
                Whiteboard->>Scratchpad: Replace design brief
                Whiteboard->>UserA: Inform user of change
                Note over Whiteboard: Brief approved — exit loop
            else Reviewer — major issues
                SubAgents-->>Whiteboard: [Brief reviewer] Problems found — here is the list
                Note over Whiteboard: Refine with user — keep looping
            end
        end
    end
    Whiteboard->>UserA: Switch to the planner conversation using /resume convo-id
```

---

## Phase 2 — Planning (implementation plan)

```mermaid
---
title: Phase 2 — Planning (implementation plan)
config:
  sequence:
    useMaxWidth: false
    wrap: true
    actorFontSize: 18
    messageFontSize: 15
    noteFontSize: 14
    actorMargin: 60
    messageMargin: 30
    mirrorActors: true
    showSequenceNumbers: true
---
sequenceDiagram
    box Planning conversation
    participant UserB
    participant Planner
    end
    box Whiteboard conversation
    participant Whiteboard
    participant UserA
    end
    participant SubAgents
    participant Scratchpad

    UserB->>Planner: Begin planning (open planning conversation)
    loop Until plan signed off and review-clean
        UserB<<->>Planner: Conversation to create / refine implementation plan
        Planner->>SubAgents: [Scout — lesser model] "Go find out x, y and z"
        SubAgents-->>Planner: Findings
        alt Brief needs clarification
            Planner->>Whiteboard: foo underspecifies bar — is it x or y? a and b contradict. z is impossible due to y.
            alt Clear-cut answer
                Note over Whiteboard: Unclear wording, OR already answered, OR UserB granted Planner permission to modify the brief AND Planner quoted UserB directly in the request
                Whiteboard->>Scratchpad: Update design brief
                Note over UserA: Only seen by the user if they switch back to the Whiteboard conversation
                Whiteboard->>UserA: "I updated the design brief at the Planner's request"
                Whiteboard-->>Planner: "Brief updated — available on the shared scratchpad"
            else Answer unsure
                Whiteboard-->>Planner: "Tell the user to switch back to the Whiteboard conversation to update the brief"
                Planner->>UserB: Switch back to Whiteboard to resolve the brief using /resume id
            end
        end
        Planner->>UserB: Draft plan for sign-off
        alt UserB rejects
            UserB->>Planner: Rejected — keep refining
        else UserB signs off
            UserB->>Planner: Sign off
            Planner->>Scratchpad: Save implementation plan
            Planner->>SubAgents: [Plan reviewer] "Review the plan against the brief"
            alt Reviewer — looks good
                SubAgents-->>Planner: [Plan reviewer] Looks good — proceed
                Note over Planner: Plan approved — exit loop
            else Reviewer — minor issues
                Note over Planner: Typo / unclear wording, OR already answered in conversation
                Planner->>Scratchpad: Replace plan
                Planner->>UserB: Inform user of change
                Note over Planner: Plan approved — exit loop
            else Reviewer — major issues
                SubAgents-->>Planner: [Plan reviewer] Problems found — here is the list
                Note over Planner: Refine with user — keep looping
            end
        end
    end
    Planner->>UserB: "You are ready to implement — switch to the orchestrator conversation when ready using /implement"
```

---

## Phase 3a — Test creation

```mermaid
---
title: Phase 3a — Test creation
config:
  sequence:
    useMaxWidth: false
    wrap: true
    actorFontSize: 18
    messageFontSize: 15
    noteFontSize: 14
    actorMargin: 60
    messageMargin: 30
    mirrorActors: true
    showSequenceNumbers: true
---
sequenceDiagram
    box Implementation conversation
        participant UserC
        participant Orchestrator
    end
    box Planning conversation
        participant Planner
    end
    participant SubAgents
    participant Scratchpad
    participant Repo

    UserC->>Orchestrator: Begin implementation (open implementation conversation)
    Orchestrator->>UserC: "Beginning test creation"
    Scratchpad-->>SubAgents: [Test creator] reads implementation plan
    loop Until tests written and conform to plan
        Orchestrator->>SubAgents: [Test creator] Create tests from the plan
        alt Plan clear enough to write tests
            Note over SubAgents: Test creator writes tests
            SubAgents->>SubAgents: [Test creator → Test reviewer] "Do these tests conform with the plan?"
            alt Reviewer — tests good
                SubAgents->>SubAgents: [Test reviewer → Test creator] Looks good
                SubAgents->>Repo: [Test creator] Write tests to tests dir
                Note over SubAgents: Tests done — exit loop
            else Reviewer — tests buggy
                SubAgents->>SubAgents: [Test reviewer → Test creator] Here is a list of problems
                Note over SubAgents: Fix tests — keep looping
            end
        else Plan unclear / wrong
            SubAgents->>Planner: [Test creator] Plan has problems x, y, z
            Note over Planner,SubAgents: PLAN-MOD subprocess, then keep looping
        end
    end
    SubAgents-->>Orchestrator: [Test creator] All tests written
```

---

## Phase 3b — Benchmark creation & baseline

```mermaid
---
title: Phase 3b — Benchmark creation & baseline
config:
  sequence:
    useMaxWidth: false
    wrap: true
    actorFontSize: 18
    messageFontSize: 15
    noteFontSize: 14
    actorMargin: 60
    messageMargin: 30
    mirrorActors: true
    showSequenceNumbers: true
---
sequenceDiagram
    box Implementation conversation
    participant UserC
    participant Orchestrator
    end
    participant SubAgents
    participant Repo
    box Planning conversation
    participant Planner
    end

    Orchestrator->>UserC: "Tests created — beginning benchmark creation"
    Note over SubAgents: Can run as a background job while implementation begins
    loop Until benchmarks written and conform to plan
        Orchestrator->>SubAgents: [Benchmark creator] Create benchmarks from the plan
        alt Plan clear enough to write benchmarks
            SubAgents->>SubAgents: [Benchmark creator → Benchmark reviewer] "Do these benchmarks conform with the plan?"
            alt Reviewer — benchmarks good
                SubAgents->>SubAgents: [Benchmark reviewer → Benchmark creator] Looks good
                SubAgents->>Repo: [Benchmark creator] Add benchmarks to /bench
                Note over SubAgents: Benchmarks done — exit loop
            else Reviewer — benchmarks buggy
                SubAgents->>SubAgents: [Benchmark reviewer → Benchmark creator] Here is a list of problems
                Note over SubAgents: Fix benchmarks — keep looping
            end
        else Plan unclear / wrong
            SubAgents->>Planner: [Benchmark creator] Plan has problems x, y, z
            Note over Planner,SubAgents: PLAN-MOD subprocess, then keep looping. Changing the plan in a material way due to benchmarking seems unlikely, so it is probably safe to be running benchmark creation and implementation concurrently.
        end
    end
    SubAgents-->>Orchestrator: [Benchmark creator] Benchmarks done
    Orchestrator->>UserC: "Benchmarks created — capturing baseline"
    Orchestrator->>SubAgents: [Benchmark runner] Run relevant benchmarks for a baseline
    SubAgents-->>Orchestrator: Baseline captured
```

---

## Phase 3c — Staged implementation

```mermaid
---
title: Phase 3c — Staged implementation
config:
  sequence:
    useMaxWidth: false
    wrap: true
    actorFontSize: 18
    messageFontSize: 15
    noteFontSize: 14
    actorMargin: 60
    messageMargin: 30
    mirrorActors: true
    showSequenceNumbers: true
---
sequenceDiagram
    box Implementation conversation
    participant UserC
    participant Orchestrator
    end
    participant SubAgents
    participant Repo
    box Planning conversation
    participant Planner
    end

    loop Stages i..j
        loop Tasks n..m
            Orchestrator->>SubAgents: [Implementor] "Implement task. If tests x and z don't pass, try to debug. If you get stuck, escalate to me."
            Note over SubAgents: Estimate task difficulty, route to the appropriate skill agent. If an agent fails, escalate to a more capable agent.
            alt Relevant tests green
                SubAgents-->>Orchestrator: Task done — tests green
                Orchestrator->>UserC: Status update
            else Relevant tests red
                alt Problem is with the test
                    Orchestrator->>SubAgents: [Test creator] "Can we change test x for reason y?"
                    alt Yes — the test really is wrong
                        SubAgents->>Repo: [Test creator] Modify test
                        SubAgents-->>Orchestrator: [Test creator] Test modified
                        Orchestrator->>UserC: Test x modified for reason z
                        Note over SubAgents: Retry task — keep looping
                    else No — Orchestrator is trying to cheat
                        SubAgents-->>Orchestrator: [Test creator] "No way, José"
                        Orchestrator->>UserC: "Houston, we have a problem"
                    end
                else Problem is with the plan
                    Orchestrator->>Planner: Task n can't be done for reason y
                    Note over Planner,Orchestrator: PLAN-MOD subprocess
                end
            end
        end
        Orchestrator->>Repo: Commit and push
    end
```

---

## Phase 3d — Optimise, verify & close out

```mermaid
---
title: Phase 3d — Optimise, verify & close out
config:
  sequence:
    useMaxWidth: false
    wrap: true
    actorFontSize: 18
    messageFontSize: 15
    noteFontSize: 14
    actorMargin: 60
    messageMargin: 30
    mirrorActors: true
    showSequenceNumbers: true
---
sequenceDiagram
    box Implementation conversation
        participant UserC
        participant Orchestrator
    end
    participant SubAgents
    participant Repo
    participant GH as gh-issues

    Note over Orchestrator: Run benchmarks and classify regressions by severity
    loop Issues n..m
        Orchestrator->>SubAgents: [Implementor] "Improve performance of function x while keeping all tests green"
        SubAgents-->>Orchestrator: Performance issue addressed
    end

    loop Until verification passes
        Orchestrator->>SubAgents: [Verifier] "Is the plan complete? In line with the design brief and project constraints?"
        alt All good
            SubAgents-->>Orchestrator: [Verifier] Good to go
            Note over Orchestrator: Verified — exit loop
        else Problems
            SubAgents-->>Orchestrator: [Verifier] Here is a list of problems
            Note over Orchestrator: May route back to implementation, test creation, benchmarking, planning or even whiteboard — but stays within the current set of conversations
            Note over Orchestrator: Re-enter the relevant loop — keep looping
        end
    end

    Orchestrator->>UserC: "Everything done. Here is a report on what was done and changes made along the way. Happy to close the issue and merge the branch into main? Want issues filed for anything that came up?"
    alt UserC approves
        UserC->>Orchestrator: Yes, go
    else UserC requests changes
        UserC->>Orchestrator: No — make the following changes
        Note over Orchestrator: Return to implementation, testing, planning or whiteboard depending on the answer
    end
    Orchestrator->>GH: Upload final design brief to the design issue, then close it
    Orchestrator->>GH: Upload final implementation plan to the implementation issue, then close it
    Orchestrator->>GH: Upload lab notebook to the notebook issue, then close it
    Orchestrator->>Repo: Open PR + merge
    Orchestrator->>UserC: "All done. Nice work."
```
