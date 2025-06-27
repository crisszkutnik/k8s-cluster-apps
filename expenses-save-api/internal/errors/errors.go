package errors

import (
	"errors"
	"fmt"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/proto"
)

type ValidationError struct {
	Field   string
	Message string
	Code    int32
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("error %d, validation error in field '%s': %s", e.Code, e.Field, e.Message)
}

type ResponseCode int32

const (
	Success ResponseCode = iota
	InternalError
	InvalidPayload
	InvalidPaymentMethod
	InvalidCategory
	InvalidSubcategory
	InvalidDate
	InvalidCurrency
)

func ReplyFromError(err error) *proto.ExpenseReply {
	var validationErr *ValidationError

	if errors.As(err, &validationErr) {
		return &proto.ExpenseReply{
			Code:    validationErr.Code,
			Message: validationErr.Error(),
		}
	}

	return &proto.ExpenseReply{
		Code:    int32(InternalError),
		Message: err.Error(),
	}
}
