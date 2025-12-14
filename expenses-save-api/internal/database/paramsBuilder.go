package database

import "strconv"

type sqlQueryParamsBuilder struct {
	ExistingParams     int
	paramDefinitionMap map[string]sqlParamDefinition
}

type comparisonType string

const (
	PARAM_EQ  comparisonType = "="
	PARAM_GT  comparisonType = ">"
	PARAM_LT  comparisonType = "<"
	PARAM_GTE comparisonType = ">="
	PARAM_LTE comparisonType = "<="
	PARAM_NEQ comparisonType = "!="
)

type sqlParamDefinition struct {
	ParamName      string
	ParamValue     any
	ComparisonType comparisonType
}

func newSqlQueryParamsBuilder() *sqlQueryParamsBuilder {
	return &sqlQueryParamsBuilder{
		ExistingParams:     0,
		paramDefinitionMap: make(map[string]sqlParamDefinition),
	}
}

func (pb *sqlQueryParamsBuilder) AddParamIfNotNull(paramName string, paramValue any, comparisonType comparisonType) {
	if paramValue == nil {
		return
	}

	pb.ExistingParams++
	pb.paramDefinitionMap[paramName] = sqlParamDefinition{
		ParamName:      paramName,
		ParamValue:     paramValue,
		ComparisonType: comparisonType,
	}
}

func (pb *sqlQueryParamsBuilder) GetJoinedParams() (string, []any) {
	if pb.ExistingParams == 0 {
		return "", []any{}
	}

	var joinedParams = "WHERE "
	var currentParamIdx = 0
	var paramValues []any

	for paramName, paramDefinition := range pb.paramDefinitionMap {
		if currentParamIdx > 0 {
			joinedParams += " AND "
		}

		joinedParams += paramName + " " + string(paramDefinition.ComparisonType) + " $" + strconv.Itoa(currentParamIdx+1)
		paramValues = append(paramValues, paramDefinition.ParamValue)
		currentParamIdx++
	}

	return joinedParams, paramValues
}
