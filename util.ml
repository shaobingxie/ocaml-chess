let deoptionalize = List.fold_left
(fun r x -> match x with
  | None -> r
  | Some x -> x :: r) []