// The parts of Ammo.js the physics uses, as globals. It isn't named ammo.d.ts, because TypeScript skips a .d.ts that
// has a .ts of the same name beside it. Ammo is Bullet compiled to WebAssembly, and has no typings of its own. Its
// objects live in WebAssembly memory, so each one made with new has to be freed with destroy

// The classic build's factory. It resolves to the module, and replaces this global with it
declare function Ammo(): Promise<Ammo.Module>

declare namespace Ammo {
  interface btVector3 {
    x(): number
    y(): number
    z(): number
    setValue(x: number, y: number, z: number): void
  }

  interface btTransform {
    setIdentity(): void
    setOrigin(origin: btVector3): void
    getOrigin(): btVector3
  }

  interface btMotionState {
    getWorldTransform(transform: btTransform): void
  }

  interface btCollisionShape {
    setMargin(margin: number): void
    calculateLocalInertia(mass: number, inertia: btVector3): void
  }

  interface btTriangleMesh {
    addTriangle(vertex0: btVector3, vertex1: btVector3, vertex2: btVector3): void
  }

  interface btRigidBody {
    getMotionState(): btMotionState
  }

  interface btDiscreteDynamicsWorld {
    setGravity(gravity: btVector3): void
    addRigidBody(body: btRigidBody): void
    removeRigidBody(body: btRigidBody): void
    stepSimulation(timeStep: number, maxSubSteps: number): void
  }

  // Objects that are only handed to other constructors, and freed
  interface btRigidBodyConstructionInfo {}
  interface btDefaultCollisionConfiguration {}
  interface btCollisionDispatcher {}
  interface btDbvtBroadphase {}
  interface btSequentialImpulseConstraintSolver {}

  // What Ammo() resolves to
  interface Module {
    btVector3: new (x: number, y: number, z: number) => btVector3
    btTransform: new () => btTransform
    btDefaultMotionState: new (startTransform: btTransform) => btMotionState
    btSphereShape: new (radius: number) => btCollisionShape
    btTriangleMesh: new () => btTriangleMesh
    btBvhTriangleMeshShape: new (
      mesh: btTriangleMesh,
      useQuantizedAabbCompression: boolean,
      buildBvh: boolean,
    ) => btCollisionShape
    btRigidBodyConstructionInfo: new (
      mass: number,
      motionState: btMotionState,
      shape: btCollisionShape,
      localInertia: btVector3,
    ) => btRigidBodyConstructionInfo
    btRigidBody: new (info: btRigidBodyConstructionInfo) => btRigidBody
    btDefaultCollisionConfiguration: new () => btDefaultCollisionConfiguration
    btCollisionDispatcher: new (configuration: btDefaultCollisionConfiguration) => btCollisionDispatcher
    btDbvtBroadphase: new () => btDbvtBroadphase
    btSequentialImpulseConstraintSolver: new () => btSequentialImpulseConstraintSolver
    btDiscreteDynamicsWorld: new (
      dispatcher: btCollisionDispatcher,
      broadphase: btDbvtBroadphase,
      solver: btSequentialImpulseConstraintSolver,
      configuration: btDefaultCollisionConfiguration,
    ) => btDiscreteDynamicsWorld
    destroy(object: object): void
  }
}
