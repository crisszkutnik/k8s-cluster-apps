# k8s-cluster-apps

All the apps that are here run in the same local Kubernetes cluster. Most of these app usually are related.

If you need extra information, look for the following repositories:

- `~/Repositories/Personal/db-schema` for the DB schema associated to these apps (users, expenses, etc.)
- `~/Repositories/home-lab/clusters` for the Kubernetes manifests of the deployments

All of the requests that require authentication go through `auth-service` first to validate the Cloudflare Zero Trust access token
