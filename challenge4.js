{
    init: function(elevators, floors) {
        console.log("=========================")
        console.log("   Starting new run     ")
        console.log("=========================")

        elevator1 = elevators[0]
        elevator1.preferredDirection = "up"
        elevator1.defaultFloor = 1
        elevator2 = elevators[1]
        elevator2.preferredDirection = "down"
        elevator2.defaultFloor = 4
        bottomFloor = 0
        console.log("Bottom floor is: ", bottomFloor)
        topFloor = floors.length - 1
        console.log("Top floor is: ", topFloor)

        let state = {
            "upRequestQueue": [],
            "downRequestQueue": [],
        }

        const callEmptyElevator = function (floorNum) {
            el1QueueLen = elevator1.destinationQueue.length
            el2QueueLen = elevator2.destinationQueue.length
            if (el1QueueLen == 0) {
                addToDestinationQueue(elevator1, floorNum)
                console.log("just called elevator1 and its destination queue is: ", elevator1.destinationQueue)
            } else if (el2QueueLen == 0) {
                addToDestinationQueue(elevator, floorNum)
                console.log("just called elevator2 and its destination queue is: ", elevator2.destinationQueue)
            }
        }

        const setDownSignal = function (elevator) {
            elevator.goingUpIndicator = false
            elevator.goingDownIndicator = true
        }

        const setUpSignal = function (elevator) {
            elevator.goingUpIndicator = true
            elevator.goingDownIndicator = false
        }

        const setSignalsForStoppedElevator = function (elevator, floorNum) {
            sortedQueue = elevator.destinationQueue.sort((a, b) => a - b)
            currentFloor = elevator.currentFloor()

            //deal with edge cases
            if (currentFloor != floorNum) {
                elevator.goToFloor(floorNum)
                return
            }
            if (floorNum == topFloor) {
                setDownSignal(elevator)
                return
            } else if (floorNum == bottomFloor) {
                setUpSignal(elevator)
                return
            }

            //if elevator is already at the closest floor
            if (currentFloor == sortedQueue[0]) {
                removeFromElevatorQueue(elevator, currentFloor)
                sortedQueue = elevator.destinationQueue.sort((a, b) => a - b)
            }

            //set direction signals based on difference between elevator and closest signal, and 
            //sort in the correct direction
            if (currentFloor > sortedQueue[0]) {
                setDownSignal(elevator)
                sortDestinationQueue(elevator, "down")
                elevator.checkDestinationQueue()
            } else if (currentFloor < sortedQueue[0]) {
                setUpSignal(elevator)
                sortDestinationQueue(elevator, "up")
                elevator.checkDestinationQueue()
            }
        }

        const describeElevator = function (elevator) {
            if (elevator == elevator1) {
                return "elevator 1"
            }
            return "elevator 2"
        }

        const someoneWantsOff = function (elevator, floorNum) {
            pressedFloors = elevator.getPressedFloors()
            wantsOff = pressedFloors.includes(floorNum)
            return wantsOff
        }

        const elevatorIsFull = function (elevator) {
            return elevator.loadFactor > .7
        }

        const someoneIsWaiting = function (direction, floorNum) {
            console.log("Checking if someone is waiting on floor ", floorNum, " ... ")
            downRequests = state.downRequestQueue
            upRequests = state.upRequestQueue
            console.log("stated direction: ", direction)
            console.log("down requests: ", downRequests, ", up requests: ", upRequests)
            console.log("downRequests.includes(floorNum): ", downRequests.includes(floorNum))
            console.log("upRequests.includes(floorNum): ", upRequests.includes(floorNum))

            if ((downRequests.includes(floorNum)) && (direction == "down")) {
                console.log("someone is waiting for down")
                return true
            }
            if ((upRequests.includes(floorNum)) && (direction == "up")) {
                console.log("someone is waiting for up")
                return true
            }
            return false
        }

        const stoppingDecision = function (elevator, floorNum) {
            console.log("checking stopping decision for ", describeElevator(elevator))
            direction = elevator.destinationDirection()
            if (someoneWantsOff(elevator, floorNum)) {
                console.log(describeElevator(elevator), ", floor ", floorNum, " stopping decision is true because someone wants off")
                return true
            }
            if (elevatorIsFull(elevator)) {
                console.log(describeElevator(elevator), ", floor ", floorNum, " stopping decision is false because elevator is full")

                return false
            }
            if (someoneIsWaiting(direction, floorNum)) {
                console.log(describeElevator(elevator), ", floor ", floorNum, " stopping decision is true because someone is waiting")

                return true
            }
            console.log(describeElevator(elevator), ", floor ", floorNum, " stopping decision is false because we reached the end of the decision tree (nobody wants off, elevator is not full, and nobody is waiting) up queue is ", state.upRequestQueue, " and down queue is ", state.downRequestQueue, " and direction is ", direction)
            return false
        }

        const setBothSignals = function (elevator) {
            elevator.goingUpIndicator = true
            elevator.goingDownIndicator = true
        }

        const removeFromUpQueue = function (floorNum) {
            floorIndex = state.upRequestQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                state.upRequestQueue.splice(floorIndex, 1)
                floorIndex = state.upRequestQueue.indexOf(floorNum)
            }
        }

        const removeFromDownQueue = function (floorNum) {
            floorIndex = state.downRequestQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                state.downRequestQueue.splice(floorIndex, 1)
                floorIndex = state.downRequestQueue.indexOf(floorNum)
            }
        }

        const elevatorAlmostThere = function (elevator, direction) {
            console.log("The destination queue for ", describeElevator(elevator), " at the start of 'elevatorAlmostThere' is ", elevator.destinationQueue)

            destinationFloorNum = elevator.destinationQueue[0]
            currentFloor = elevator.currentFloor()
            if (Math.abs(destinationFloorNum - currentFloor) == 1) {
                if (direction == "up") {
                    removeFromUpQueue(destinationFloorNum)
                }

                if (direction == "down") {
                    removeFromDownQueue(destinationFloorNum)
                }
                console.log("The destination queue for ", describeElevator(elevator), " near the end of 'elevatorAlmostThere' is ", elevator.destinationQueue)
                return true
            }
            return false
        }

        const setSignalsForMovingElevator = function (elevator, direction) {
            if ((elevator.loadFactor == 0) && elevatorAlmostThere(elevator, direction)) {
                setBothSignals(elevator)
            } else if (direction == "up") {
                setUpSignal(elevator)
            } else if (direction == "down") {
                setDownSignal(elevator)
            } else {
                console.warn("attempted to change elevator signal but it was stopped")
            }
        }

        const getNextPassenger = function (elevator) {
            if (allQueuesEmpty()) {
                return
            }
            while (elevator.destinationQueue.length == 0) {
                firstUpFloor = state.upRequestQueue[0]
                firstDownFloor = state.downRequestQueue[0]
                if (elevator == elevator1) {
                    if (state.upRequestQueue.length > 0) {
                        addToDestinationQueue(elevator, firstUpFloor)
                        elevator.goToFloor(firstUpFloor)
                        removeFromUpQueue(firstUpFloor)
                        console.log("GetNextPassenger added floor ", firstUpFloor, " to ", describeElevator(elevator), ".  Queue is now ", elevator.destinationQueue)
                    } else {
                        addToDestinationQueue(elevator, firstDownFloor)

                        elevator.goToFloor(firstDownFloor)
                        removeFromDownQueue(firstDownFloor)
                        console.log("GetNextPassenger added floor ", firstDownFloor, " to ", describeElevator(elevator), ".  Queue is now ", elevator.destinationQueue)
                    }
                    elevator.checkDestinationQueue()
                } else {
                    if (state.downRequestQueue.length > 0) {
                        addToDestinationQueue(elevator, firstDownFloor)

                        elevator.goToFloor(firstDownFloor)
                        removeFromDownQueue(firstDownFloor)
                        console.log("GetNextPassenger added floor ", firstDownFloor, " to ", describeElevator(elevator), ".  Queue is now ", elevator.destinationQueue)

                    } else {
                        addToDestinationQueue(elevator, firstUpFloor)

                        elevator.goToFloor(firstUpFloor)
                        removeFromUpQueue(firstUpFloor)
                        console.log("GetNextPassenger added floor ", firstUpFloor, " to ", describeElevator(elevator), ".  Queue is now ", elevator.destinationQueue)
                    }
                }
            }
        }

        const allQueuesEmpty = function () {
            return ((state.upRequestQueue.length == 0) && (state.downRequestQueue.length == 0))
        }

        const sortDestinationQueue = function (elevator, direction = "stopped") {
            if (direction == "up") {
                let sortedQueue = elevator.destinationQueue.sort((a, b) => a - b)
                return sortedQueue
            } else if (direction == "down") {
                let sortedQueue = elevator.destinationQueue.sort((a, b) => b - a)
                return sortedQueue
            }
            console.warn("No destination direction for sorting.  Returning default queue")
            return elevator.destinationQueue
        }

        const restart = function (elevator) {
            console.log(describeElevator(elevator), "'s destination queue is ", elevator.destinationQueue, "at the start of the restart function")

            elevator.destinationQueue = elevator.getPressedFloors()
            while (elevator.destinationQueue.length == 0) {
                getNextPassenger(elevator)
            }
            elevator.destinationQueue = sortDestinationQueue(elevator)
            elevator.checkDestinationQueue()
            console.log(describeElevator(elevator), "'s destination queue is ", elevator.destinationQueue, "near the end of the restart function")
            elevator.goToFloor(elevator.destinationQueue[0])

        }

        const addToDestinationQueue = function (elevator, floorNum) {
            elevator.destinationQueue.push(floorNum)
            elevator.destinationQueue = sortDestinationQueue(elevator)
            elevator.checkDestinationQueue()
        }

        const goToDefaultFloor = function (elevator) {
            if (elevator == elevator1) {
                console.log("sending", describeElevator(elevator), " to default floor ", elevator1.defaultFloor)
                elevator.goToFloor(elevator1.defaultFloor)
            }
            if (elevator == elevator2) {
                console.log("sending", describeElevator(elevator), " to default floor ", elevator2.defaultFloor)
                elevator.goToFloor(elevator2.defaultFloor)
            }
        }

        floors.forEach(floor => {

            floor.on("up_button_pressed", function () {
                floorNum = floor.floorNum()
                newUpRequestQueue = [...new Set([...state.upRequestQueue, floorNum])]
                state.upRequestQueue = newUpRequestQueue
                console.log("up was pressed on floor ", floorNum, ".  upRequestQueue is now: ", state.upRequestQueue)
                callEmptyElevator(floorNum)
            })
            floor.on("down_button_pressed", function () {
                floorNum = floor.floorNum()
                newDownRequestQueue = [...new Set([...state.downRequestQueue, floorNum])]
                state.downRequestQueue = newDownRequestQueue
                console.log("down was pressed on floor ", floorNum, "  downRequestQueue is now: ", state.downRequestQueue)
                callEmptyElevator(floorNum)
            })
        })

        elevators.forEach(elevator => {

            elevator.on("floor_button_pressed", function (floorNum) {
                addToDestinationQueue(elevator, floorNum)
                console.log("button", floorNum, " pressed in elevator:", describeElevator(elevator), "while on floor ", elevator.currentFloor())
                console.log("its new destination queue is: ", elevator.destinationQueue, "and its direction is: ", elevator.destinationDirection())
            })

            elevator.on("passing_floor", function (floorNum, direction) {
                setSignalsForMovingElevator(elevator, direction)
                elevatorAlmostThere(elevator, direction)
                shouldStop = stoppingDecision(elevator, floorNum)
                if (shouldStop == true) {
                    console.log(describeElevator(elevator), "decided to stop at floor ", floorNum)
                    elevator.stop()
                    elevator.goToFloor(floorNum, true)
                    restart(elevator)
                }
            })

            elevator.on("stopped_at_floor", function (floorNum) {
                setSignalsForStoppedElevator(elevator, floorNum)
                console.log(describeElevator(elevator), "has stoppped at floor", floorNum, " and its signals were (up, down) ", elevator.goingUpIndicator, elevator.goingDownIndicator)
                restart(elevator)
                console.log(describeElevator(elevator), "'s destination queue is now: ", elevator.destinationQueue, "and it's on the way to floor ", elevator.destinationQueue[0])
            })

            elevator.on("idle", function () {
                setBothSignals(elevator)
                if (elevator.currentFloor() === bottomFloor) {
                    setUpSignal(elevator)
                }
                console.log(describeElevator(elevator), " is idle")
                goToDefaultFloor(elevator)
            })
        })
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}