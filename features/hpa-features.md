- can be applied to Stateful Sets and not only to Deployments.
- can be applied for each deployment seperate, while the OptTrafScheduler can be applied to a specific namespace.
- can have custom metrics like request_per_second etc., while trafOptScheduler can be applied base on cpu, memory and a mix of them 2.
- define fine-tuning scaling.
| Field                        | Description                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `stabilizationWindowSeconds` | Wait time before scaling happens                                                 |
| `selectPolicy`               | How multiple policies are evaluated (`Max`, `Min`, `Disabled`)                   |
| `policies`                   | One or more rules controlling **how fast** to scale (by percentage or pod count) |
| `periodSeconds`              | Time window over which the policy applies                                        |

#### stabilizationWindowSeconds
This is a cooldown timer.

scaleUp.stabilizationWindowSeconds: 30 => Don’t immediately scale up; wait 30 seconds to confirm it's needed.
scaleDown.stabilizationWindowSeconds: 300 => Wait 5 minutes before scaling down (common in production to prevent flapping)

#### policies – How fast scaling is allowed
You can define one or more scaling rate limits, like:

```yaml
- type: Percent
  value: 100
  periodSeconds: 60
```
| Field               | Meaning                                       |
| ------------------- | --------------------------------------------- |
| `type: Percent`     | Limit is based on % of current pods           |
| `value: 100`        | Can add/remove **up to 100%** of current pods |
| `periodSeconds: 60` | Only every 60 seconds                         |

**Example:**
If you have 10 pods, the HPA can add or remove up to 10 pods every 60 seconds.

You can also use:

```yaml
- type: Pods
  value: 3
  periodSeconds: 60
```
Limit scaling to 3 pods every 60 seconds.

#### selectPolicy

When you define multiple policies (e.g., Percent + Pods), this field chooses which policy to apply.

| Value      | What It Does                                       |
| ---------- | -------------------------------------------------- |
| `Max`      | Use the policy that allows the **most change**     |
| `Min`      | Use the policy that allows the **least change**    |
| `Disabled` | Ignore policies (⚠️ Not recommended in most cases) |

**Example: Controlled Scale Up/Down**

```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 60
    selectPolicy: Max
    policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 4
        periodSeconds: 30
  scaleDown:
    stabilizationWindowSeconds: 300
    selectPolicy: Min
    policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
```

This means:

- Scale up fast (100% or 4 pods every 30s, whichever is more)
- Scale down cautiously (max 2 pods or 50% every 60s, whichever is less)
- Wait 5 minutes before scaling down

