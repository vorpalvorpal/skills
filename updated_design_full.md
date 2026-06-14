---
title: r-science workflow — whiteboard → plan → implement
config:
  sequence:
    useMaxWidth: false      # render at full size instead of shrinking to fit (the key one)
    wrap: true              # wrap long message text instead of stretching columns wide
    actorFontSize: 18
    messageFontSize: 15
    noteFontSize: 14
    actorMargin: 60         # horizontal gap between participant columns
    messageMargin: 30       # vertical gap between messages
    mirrorActors: true      # repeat the participant headers at the bottom (orientation aid)
    showSequenceNumbers: true  # autonumber messages so you can refer to "step 42"
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

    Note over UserA,Orchestrator: UserA, UserB and UserC are the same person — shown separately to emphasise different conversations / context windows. Whiteboard only sees text written by UserA, Planner only sees text written by UserB, etc.

    UserA->>Whiteboard: Initial idea (/whiteboard issue #1)
    loop Until brief signed off and review-clean
        UserA->>Whiteboard: Conversation to create / refine design brief
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
    Whiteboard->>UserA: Switch to the planner conversation using /switch convo-id

    UserB->>Planner: Begin planning (open planning conversation)
    loop Until plan signed off and review-clean
        UserB->>Planner: Conversation to create / refine implementation plan
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
                Planner->>UserB: Switch back to Whiteboard to resolve the brief
            end
        else Brief is clear
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
    end
    Planner->>UserB: "You are ready to implement — switch to the orchestrator conversation when ready"

    UserC->>Orchestrator: Begin implementation (open implementation conversation)

    Orchestrator->>UserC: "Beginning test creation"
    Scratchpad-->>SubAgents: [Test creator] reads implementation plan
    loop Until tests written and conform to plan
        Orchestrator->>SubAgents: [Test creator] Create tests from the plan
        alt Plan clear enough to write tests
            SubAgents->>SubAgents: [Test creator → Test reviewer] "Do these tests conform with the plan?"
            alt Reviewer — tests good
                SubAgents->>SubAgents: [Test reviewer → Test creator] Looks good
                SubAgents->>Repo: [Test creator] Write tests to /tests
                Note over SubAgents: Tests done — exit loop
            else Reviewer — tests buggy
                SubAgents->>SubAgents: [Test reviewer → Test creator] Here is a list of problems
                Note over SubAgents: Fix tests — keep looping
            end
        else Plan unclear / wrong
            SubAgents->>Planner: [Test creator] Plan has problems x, y, z
            Note over Planner,Orchestrator: PLAN-MOD subprocess (full definition below)
            alt minor issues
                Planner->>Scratchpad: Replace plan
                Planner->>UserB: Inform user of changes (seen if they switch back)
                Planner-->>Orchestrator: Inform user of the following changes "foo"
                Orchestrator->>UserC: Changes "foo" made to plan
                Planner-->>SubAgents: [Test creator] Plan fixed — redo affected work
                Note over SubAgents: Keep looping
            else major issues
                Planner-->>Orchestrator: Tell user to return to the planning conversation
                Orchestrator->>UserC: Return to the planning conversation
                Note over UserB,Planner: Cross-conversation jump — re-enter the planning loop above
            end
            Note over Planner,Orchestrator: end PLAN-MOD subprocess
        end
    end
    SubAgents-->>Orchestrator: [Test creator] All tests written

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
            Note over Planner,Orchestrator: PLAN-MOD subprocess (see test creation)
        end
    end
    SubAgents-->>Orchestrator: [Benchmark creator] Benchmarks done
    Orchestrator->>UserC: "Benchmarks created — capturing baseline"
    Orchestrator->>SubAgents: [Benchmark runner] Run benchmarks for a baseline
    SubAgents-->>Orchestrator: Baseline captured

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
                    Note over Planner,Orchestrator: PLAN-MOD subprocess (see test creation)
                end
            end
        end
        Orchestrator->>Repo: Commit and push
    end

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
