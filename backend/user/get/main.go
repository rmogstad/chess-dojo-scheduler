package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.UserGetter = database.DynamoDB

const funcName = "user-get-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	username, public := event.PathParameters["username"]
	if !public {
		username = info.Username
	}

	if username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(funcName, err), nil
	}

	user, err := repository.GetUser(username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if user.Username != info.Username {
		if user.HideChesscomUsername {
			user.ChesscomUsername = ""
		}
		if user.HideLichessUsername {
			user.LichessUsername = ""
		}
		if user.HideFideId {
			user.FideId = ""
		}
		if user.HideUscfId {
			user.UscfId = ""
		}
	}

	return api.Success(funcName, user), err
}

func main() {
	lambda.Start(Handler)
}
