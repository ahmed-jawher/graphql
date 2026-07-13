const AUTH_URL = "https://learn.reboot01.com/api/auth/signin";
const GRAPHQL_URL = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

const USER_PROFILE_QUERY = `
  query {
    user {
      id
      login
      attrs
      email
      campus
      profile
      lastName
      firstName
      auditRatio
      totalUp
      totalDown
      timeline: transactions(
        where: {
          type: { _eq: "xp" }
          _and: [
            { path: { _nlike: "%/piscine-js/%" } }
            { path: { _nlike: "%/piscine-go/%" } }
          ]
        }
      ) {
        amount
        createdAt
        path
      }
    }
  }
`;

const SKILLS_QUERY = `
  query Transaction2 {
    transaction(
      where: {
        type: { _iregex: "(^|[^[:alnum:]_])[[:alnum:]_]*skill_[[:alnum:]_]*($|[^[:alnum:]_])" }
      }
    ) {
      amount
      type
    }
  }
`;

const LEVEL_QUERY = `
  query Event_user($userlogin: String) {
    event_user(
      where: {
        userLogin: { _eq: $userlogin }
        event: { path: { _eq: "/bahrain/bh-module" } }
      }
    ) {
      level
    }
  }
`;

const TOTAL_XP_QUERY = `
  query {
    transaction_aggregate(
      where: {
        event: { path: { _eq: "/bahrain/bh-module" } }
        type: { _eq: "xp" }
      }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
  }
`;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function signin(identifier, password) {
  const credentials = btoa(`${identifier}:${password}`);
  let response;
  try {
    response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    throw new ApiError("network error", 0);
  }

  if (!response.ok) {
    throw new ApiError("Incorrect username or password", response.status);
  }

  return response.json();
}

export async function graphqlRequest(query, variables, token) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new ApiError("GraphQL request failed", response.status);
  }

  const body = await response.json();
  if (body.errors) {
    throw new ApiError(body.errors[0]?.message || "GraphQL error", response.status);
  }

  return body.data;
}

export async function fetchUserProfile(token) {
  const data = await graphqlRequest(USER_PROFILE_QUERY, {}, token);
  return data.user[0];
}

export async function fetchSkills(token) {
  const data = await graphqlRequest(SKILLS_QUERY, {}, token);
  return data.transaction;
}

export async function fetchLevel(token, userLogin) {
  const data = await graphqlRequest(LEVEL_QUERY, { userlogin: userLogin }, token);
  return data.event_user[0]?.level ?? null;
}

export async function fetchTotalXp(token) {
  const data = await graphqlRequest(TOTAL_XP_QUERY, {}, token);
  return data.transaction_aggregate.aggregate.sum.amount ?? 0;
}

export { ApiError };
