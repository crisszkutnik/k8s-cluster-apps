package database

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type connectionWrapper struct {
	conn *pgx.Conn
}

func newConnectionWrapper(conn *pgx.Conn) *connectionWrapper {
	return &connectionWrapper{conn: conn}
}

func (c *connectionWrapper) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	rows, err := c.conn.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	return rows, nil
}
