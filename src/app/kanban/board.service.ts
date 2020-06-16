import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Board, Task } from './board.model';
import * as firebase from 'firebase/app';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore
  ) { }

  /**
   * Creates a new board for the current user
   * @param data
   */
  async createBoard(data: Board) {
    const user = await this.afAuth.currentUser;
    return this.db.collection('boards').add({
      ...data,
      uid: user.uid,
      tasks: [{ description: 'Hello', label: 'yellow' }]
    });
  }

  /**
   * Delete board
   * @param boardId 
   */
  deleteBoard(boardId: string) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .delete();
  }

  /**
   * Updates the tasks
   * @param boardId 
   * @param tasks 
   */
  updateTasks(boardId: string, tasks: Task[]) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .update({ tasks });
  }

  /**
   * Deletes tasks
   * @param boardId 
   * @param task 
   */
  removeTask(boardId: string, task: Task) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .update({
        tasks: firebase.firestore.FieldValue.arrayRemove(task)
      });
  }

  /**
   * Gets the users boards
   */
  getUserBoards() {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.db 
            .collection<Board>('boards', ref =>
              ref.where('uid', '==', user.uid).orderBy('priority')
            )
            .valueChanges({ idField: 'id'})
        } else {
          return [];
        }
      })
    );
  }

  /**
   * sorts the boards when the user drags and drops
   * @param boards 
   */
  sortBoards(boards: Board[]) {
    const db = firebase.firestore();
    const batch = db.batch();
    const refs = boards.map(b => db.collection('boards').doc(b.id));
    refs.forEach((ref, idx) => batch.update(ref, { priority: idx }));
    batch.commit();
  }
}
