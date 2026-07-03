# Java Ecosystem Follow-Ups

Status was refreshed on 2026-06-30; only unfinished Java follow-ups remain here.

---

## Web Frameworks

- [ ] Add `micronaut` — compile-time DI, low memory footprint, GraalVM native-image support.

## API Styles

- [ ] Add `grpc-java`
- [ ] Add `openapi-generator`

## Observability

- [ ] Expand Spring Actuator examples beyond dependency wiring

## Logging

- [ ] Add `log4j2` as an alternative logger

## Runtime Validation

- [ ] Add CI/runtime validation for generated Maven projects
- [ ] Add CI/runtime validation for generated Gradle projects
- [ ] Run generated `./mvnw test` and `./gradlew test` in a Java-enabled smoke lane

## Future Implementation Notes

- Keep Java compatibility logic in `packages/types/src/compatibility.ts` aligned with template-handler support.
- Keep generated Maven and Gradle dependencies covered by `scripts/check-dep-versions.ts`.
- Add new Java options as vertical slices: schema, metadata, compatibility, CLI, web, template, docs, snapshots, and smoke coverage together.

## Priority Order

1. **Generated Maven/Gradle runtime validation** — make the existing Java surface trustworthy under smoke/ScaffBench.
2. **Micronaut** — only major Java framework candidate still listed.
3. **gRPC Java** — deferred because protoc/build-plugin work needs a careful vertical slice.
4. **Actuator example depth** — go beyond dependency wiring.
5. **Log4j2** — optional logging alternative if user demand appears.
