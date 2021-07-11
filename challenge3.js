{
    init: function(elevators, floors) {
        var elevator = elevators[0]
        console.log(elevators)
        const isPressedDown = function (floor) {
            return floor.buttonStates.down === "activated";
        }
        const isPressedUp = function (floor) {
            return floor.buttonStates.up === "activated";
        }
        const isElevatorFull = function (elevator) {
            return elevator.loadFactor > .85;
        }
        const isDestination = function (elevator, floorNum) {
            return elevator.getPressedFloors().includes(floorNum);
        };
        elevators.forEach(elevator => {
            elevator.on("idle", function () {
                floors.forEach(function (floor) {
                    if (isDestination(elevator, floor.floorNum()) || ((isPressedDown(floor) || isPressedUp(floor)) && !isElevatorFull(elevator))) {
                        elevator.goToFloor(floor.floorNum())
                    }
                })
            })
        })
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}